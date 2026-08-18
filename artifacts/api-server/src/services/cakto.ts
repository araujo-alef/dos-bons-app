import { timingSafeEqual } from "node:crypto";
import { logger } from "../lib/logger";

/**
 * Cakto webhook service — parsing, safe logging and (future) authenticity
 * validation for events sent by Cakto.
 *
 * Etapa 1: apenas receber, validar formato básico e logar com segurança.
 * Nada de Firebase, entitlements ou checkout ainda.
 */

/** Shape mínimo que aceitamos de um evento Cakto. Campos extras são ignorados. */
export interface CaktoEvent {
  /** Tipo/nome do evento (ex.: "purchase_approved"). */
  event: string;
  /** Payload bruto (já parseado de JSON) — mantido para inspeção futura. */
  raw: Record<string, unknown>;
  /** Identificador do pedido/transação, se presente. */
  transactionId: string | null;
  /** Produto/oferta, se presente. */
  product: string | null;
  /** E-mail do comprador, se presente. */
  customerEmail: string | null;
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

/** Primeiro valor string não-vazio dentre vários caminhos possíveis. */
function firstString(
  obj: Record<string, unknown>,
  paths: string[][],
): string | null {
  for (const p of paths) {
    const s = asString(pick(obj, p));
    if (s) return s;
  }
  return null;
}

/**
 * Faz o parse defensivo do corpo do webhook. A Cakto envia JSON; como o
 * formato exato pode variar por tipo de evento, procuramos os campos de
 * interesse em caminhos comuns sem depender de um schema rígido.
 */
export function parseCaktoEvent(body: unknown): ParseResult {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Body must be a JSON object" };
  }
  const obj = body as Record<string, unknown>;

  const event = firstString(obj, [["event"], ["type"], ["event_type"]]);
  if (!event) {
    return { ok: false, error: "Missing event type field" };
  }

  const transactionId = firstString(obj, [
    ["data", "id"],
    ["data", "transaction_id"],
    ["data", "order_id"],
    ["transaction_id"],
    ["order_id"],
    ["id"],
  ]);

  const product = firstString(obj, [
    ["data", "product", "name"],
    ["data", "product", "id"],
    ["data", "offer", "name"],
    ["data", "offer", "id"],
    ["product", "name"],
    ["product"],
  ]);

  const customerEmail = firstString(obj, [
    ["data", "customer", "email"],
    ["data", "buyer", "email"],
    ["customer", "email"],
    ["email"],
  ]);

  return {
    ok: true,
    event: { event, raw: obj, transactionId, product, customerEmail },
  };
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
 * Extrai a credencial enviada pela Cakto no request.
 *
 * ATENÇÃO: o mecanismo oficial da Cakto (body? header? outro?) ainda NÃO foi
 * confirmado. Esta função é o ÚNICO ponto a ajustar depois de capturarmos um
 * webhook real da Cakto em modo de teste. Por ora, aceitamos os candidatos
 * mais prováveis (campo `secret` no body ou header `x-cakto-secret`) — se a
 * Cakto usar outro mecanismo, requests legítimos serão rejeitados no modo
 * seguro até ajustarmos aqui.
 */
export function extractCaktoCredential(
  body: Record<string, unknown>,
  headers: Record<string, string | string[] | undefined>,
): string | null {
  const headerCandidate = headers["x-cakto-secret"];
  if (typeof headerCandidate === "string" && headerCandidate.length > 0) {
    return headerCandidate;
  }
  return asString(body["secret"]);
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
 *   fail-closed — só passa com credencial presente E idêntica ao secret.
 *   Ausência de credencial = inválido. Divergência = inválido.
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
