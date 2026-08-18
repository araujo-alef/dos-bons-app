import { timingSafeEqual } from "node:crypto";
import { logger } from "../lib/logger";

/**
 * Cakto webhook service — parsing, safe logging and authenticity validation
 * for events sent by Cakto, seguindo o modelo oficial de payload apresentado
 * no painel da Cakto:
 *
 * {
 *   "secret": "...",
 *   "event": "purchase_approved",
 *   "data": {
 *     "id": "...", "refId": "...",
 *     "customer": { "name": "...", "email": "..." },
 *     "offer": { "id": "...", "name": "..." },
 *     "product": { "id": "...", "short_id": "...", "name": "...", "type": "unique" },
 *     "status": "paid",
 *     "paidAt": "..."
 *   }
 * }
 *
 * Etapa atual: receber, autenticar, validar e logar com segurança.
 * Sem Firebase, Firestore, accessLevel ou criação de usuário ainda.
 */

/** Evento Cakto normalizado a partir dos caminhos oficiais do payload. */
export interface CaktoEvent {
  /** Tipo do evento — body.event (ex.: "purchase_approved"). */
  event: string;
  /** Payload bruto (já parseado de JSON) — mantido para inspeção; nunca logar inteiro. */
  raw: Record<string, unknown>;
  /**
   * Identificador único do pedido/evento — body.data.id.
   * Será a chave de idempotência quando houver persistência.
   */
  transactionId: string | null;
  /** Referência do pedido — body.data.refId. */
  refId: string | null;
  /** E-mail do comprador — body.data.customer.email. */
  customerEmail: string | null;
  /**
   * Identificador CANÔNICO do produto — body.data.product.id.
   * É este campo que decidirá o mapeamento de acesso, nunca nome/oferta/preço.
   */
  productId: string | null;
  /** body.data.product.short_id (metadata). */
  productShortId: string | null;
  /** body.data.product.name (metadata; não usar como chave de acesso). */
  productName: string | null;
  /** body.data.offer.id (metadata). */
  offerId: string | null;
  /** body.data.offer.name (metadata). */
  offerName: string | null;
  /** body.data.status (ex.: "paid"). */
  status: string | null;
  /** body.data.paidAt. */
  paidAt: string | null;
}

/** Resultado da tentativa de parse do corpo recebido. */
export type ParseResult =
  | { ok: true; event: CaktoEvent }
  | { ok: false; error: string };

function asString(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

function pick(obj: Record<string, unknown>, path: string[]): unknown {
  let cur: unknown = obj;
  for (const key of path) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

function pickString(obj: Record<string, unknown>, path: string[]): string | null {
  return asString(pick(obj, path));
}

/**
 * Parse do corpo do webhook seguindo os caminhos OFICIAIS do payload Cakto.
 */
export function parseCaktoEvent(body: unknown): ParseResult {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Body must be a JSON object" };
  }
  const obj = body as Record<string, unknown>;

  const event = pickString(obj, ["event"]);
  if (!event) {
    return { ok: false, error: "Missing event type field" };
  }

  return {
    ok: true,
    event: {
      event,
      raw: obj,
      transactionId: pickString(obj, ["data", "id"]),
      refId: pickString(obj, ["data", "refId"]),
      customerEmail: pickString(obj, ["data", "customer", "email"]),
      productId: pickString(obj, ["data", "product", "id"]),
      productShortId: pickString(obj, ["data", "product", "short_id"]),
      productName: pickString(obj, ["data", "product", "name"]),
      offerId: pickString(obj, ["data", "offer", "id"]),
      offerName: pickString(obj, ["data", "offer", "name"]),
      status: pickString(obj, ["data", "status"]),
      paidAt: pickString(obj, ["data", "paidAt"]),
    },
  };
}

/**
 * Validação mínima obrigatória para purchase_approved:
 * data.id, data.customer.email, data.product.id presentes e data.status === "paid".
 * Retorna a lista de problemas (vazia = válido).
 */
export function validatePurchaseApproved(event: CaktoEvent): string[] {
  // Códigos fixos — nunca interpolar valores vindos do payload.
  const problems: string[] = [];
  if (!event.transactionId) problems.push("missing_data_id");
  if (!event.customerEmail) problems.push("missing_customer_email");
  if (!event.productId) problems.push("missing_product_id");
  if (event.status !== "paid") problems.push("status_not_paid");
  return problems;
}

/** Mascara e-mail para log: "bernardo@gmail.com" → "be***@gmail.com". */
export function maskEmail(email: string | null): string | null {
  if (!email) return null;
  const at = email.indexOf("@");
  if (at <= 0) return "***";
  const local = email.slice(0, at);
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***${email.slice(at)}`;
}

/**
 * Extrai a credencial enviada pela Cakto.
 *
 * Contrato oficial (confirmado no painel da Cakto): a credencial vem no campo
 * raiz `body.secret`. Mantemos o header `x-cakto-secret` apenas como fallback
 * legado — o body tem precedência.
 *
 * NUNCA logar o valor retornado por esta função.
 */
export function extractCaktoCredential(
  body: Record<string, unknown>,
  headers: Record<string, string | string[] | undefined>,
): string | null {
  const bodyCandidate = asString(body["secret"]);
  if (bodyCandidate) return bodyCandidate;

  const headerCandidate = headers["x-cakto-secret"];
  return typeof headerCandidate === "string" && headerCandidate.length > 0
    ? headerCandidate
    : null;
}

/** Comparação em tempo constante para evitar timing attacks. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Validação de autenticidade do webhook — dois modos:
 *
 * MODO DE TESTE (CAKTO_WEBHOOK_SECRET ausente):
 *   aceita tudo e loga claramente que a validação está DESATIVADA. Serve
 *   apenas para capturar/testar o payload real da Cakto.
 *
 * MODO SEGURO (CAKTO_WEBHOOK_SECRET configurado):
 *   fail-closed — só passa com `body.secret` presente E idêntico ao secret.
 *   Ausência = 401. Divergência = 401.
 */
export function verifyCaktoAuthenticity(
  body: Record<string, unknown>,
  headers: Record<string, string | string[] | undefined>,
): { ok: boolean; mode: "test" | "secure"; reason: string } {
  const secret = process.env["CAKTO_WEBHOOK_SECRET"];
  if (!secret) {
    logger.warn(
      "cakto-webhook: AUTH VALIDATION DISABLED (CAKTO_WEBHOOK_SECRET not set) — test mode only, do not use in production",
    );
    return { ok: true, mode: "test", reason: "validation-disabled" };
  }

  const candidate = extractCaktoCredential(body, headers);
  if (candidate === null) {
    return { ok: false, mode: "secure", reason: "credential-missing" };
  }
  if (!safeEqual(candidate, secret)) {
    return { ok: false, mode: "secure", reason: "credential-mismatch" };
  }
  return { ok: true, mode: "secure", reason: "credential-valid" };
}
