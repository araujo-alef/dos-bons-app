import {
  db,
  caktoEntitlementsTable,
  caktoPurchasesTable,
} from "@workspace/db";
import { and, eq, sql } from "drizzle-orm";
import { logger } from "../lib/logger";
import type { CaktoEvent } from "./cakto";

/**
 * Lógica de planos da integração Cakto — modelo LEDGER.
 *
 * Cada transação (data.id) vira uma linha em cakto_purchases com um status
 * (paid | refunded | chargeback). O entitlement em cakto_entitlements é
 * sempre DERIVADO das compras com status "paid" via recalculateEntitlement:
 *
 *   deluxe pago                    → deluxe
 *   essential pago + upgrade pago  → deluxe
 *   essential OU upgrade pago      → essential
 *   nada pago                      → null (linha removida)
 *
 * O upgrade é complemento do essential; sozinho vale essential e NUNCA é
 * gravado como plano. Refund/chargeback são estados terminais da compra:
 * um purchase_approved reenviado não ressuscita uma compra estornada.
 */

export type Plan = "essential" | "deluxe";
export type CommercialType = "essential" | "deluxe" | "upgrade";
export type PurchaseStatus = "paid" | "refunded" | "chargeback";

/** Envs oficiais com os IDs dos produtos Cakto — únicos pontos de leitura. */
const PRODUCT_ENV_KEYS = [
  "CAKTO_PRODUCT_ESSENTIAL_ID",
  "CAKTO_PRODUCT_DELUXE_ID",
  "CAKTO_PRODUCT_UPGRADE_ID",
] as const;

/**
 * Valida a presença das envs de produto. Chamar no boot do servidor.
 * Loga apenas quais chaves faltam — nunca os valores.
 */
export function validateCaktoProductEnvs(): void {
  const missing = PRODUCT_ENV_KEYS.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    logger.error(
      { missing },
      "cakto-plans: missing product env vars — product mapping will treat purchases as unknown product until configured",
    );
  }
}

/** Resolve o tipo comercial a partir do product.id recebido (fonte canônica). */
export function resolveCommercialType(
  productId: string,
): CommercialType | null {
  if (productId === process.env["CAKTO_PRODUCT_ESSENTIAL_ID"]) return "essential";
  if (productId === process.env["CAKTO_PRODUCT_DELUXE_ID"]) return "deluxe";
  if (productId === process.env["CAKTO_PRODUCT_UPGRADE_ID"]) return "upgrade";
  return null;
}

/** Regra comercial oficial: deriva o plano das compras pagas. */
export function derivePlan(paidTypes: ReadonlySet<CommercialType>): Plan | null {
  if (paidTypes.has("deluxe")) return "deluxe";
  if (paidTypes.has("essential") && paidTypes.has("upgrade")) return "deluxe";
  if (paidTypes.has("essential") || paidTypes.has("upgrade")) return "essential";
  return null;
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Recalcula e persiste o entitlement de um e-mail a partir do ledger.
 * DEVE rodar dentro da transação que já detém o advisory lock do e-mail.
 * Retorna { previousPlan, resultingPlan }.
 */
async function recalculateEntitlement(
  tx: Tx,
  email: string,
): Promise<{ previousPlan: Plan | null; resultingPlan: Plan | null }> {
  const entRows = await tx
    .select()
    .from(caktoEntitlementsTable)
    .where(eq(caktoEntitlementsTable.email, email))
    .for("update");
  const previousPlan: Plan | null = entRows[0]?.plan ?? null;

  const paid = await tx
    .select({ commercialType: caktoPurchasesTable.commercialType })
    .from(caktoPurchasesTable)
    .where(
      and(
        eq(caktoPurchasesTable.email, email),
        eq(caktoPurchasesTable.status, "paid"),
      ),
    );
  const resultingPlan = derivePlan(new Set(paid.map((r) => r.commercialType)));

  if (resultingPlan === previousPlan) return { previousPlan, resultingPlan };

  if (resultingPlan === null) {
    await tx
      .delete(caktoEntitlementsTable)
      .where(eq(caktoEntitlementsTable.email, email));
  } else if (previousPlan === null) {
    await tx
      .insert(caktoEntitlementsTable)
      .values({ email, plan: resultingPlan });
  } else {
    await tx
      .update(caktoEntitlementsTable)
      .set({ plan: resultingPlan, updatedAt: sql`now()` })
      .where(eq(caktoEntitlementsTable.email, email));
  }
  return { previousPlan, resultingPlan };
}

function parseTimestamp(value: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export interface PlanChange {
  previousPlan: Plan | null;
  resultingPlan: Plan | null;
}

export type ApprovedOutcome =
  | ({ result: "purchase_recorded"; commercialType: CommercialType } & PlanChange)
  | { result: "duplicate_ignored" }
  | { result: "purchase_already_revoked" }
  | { result: "unknown_product" };

/**
 * Processa uma compra aprovada (já autenticada e validada):
 * grava/garante a linha "paid" no ledger e recalcula o entitlement.
 *
 * Idempotência: transaction_id é PK do ledger. Reenvio do mesmo evento →
 * conflito → "duplicate_ignored". Se a compra já foi estornada
 * (refunded/chargeback), o estado terminal prevalece — não ressuscita.
 */
export async function processApprovedPurchase(
  evt: CaktoEvent,
): Promise<ApprovedOutcome> {
  // Campos garantidos por validatePurchaseApproved antes desta chamada.
  const transactionId = evt.transactionId as string;
  const productId = evt.productId as string;
  const email = (evt.customerEmail as string).trim().toLowerCase();

  const commercialType = resolveCommercialType(productId);
  if (commercialType === null) return { result: "unknown_product" };

  return db.transaction(async (tx) => {
    // Serializa por e-mail: evita corrida entre eventos quase simultâneos
    // (ex.: approved + refund). Lock liberado no fim da transação.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${email}))`);

    const inserted = await tx
      .insert(caktoPurchasesTable)
      .values({
        transactionId,
        email,
        productId,
        commercialType,
        status: "paid",
        paidAt: parseTimestamp(evt.paidAt) ?? new Date(),
        refId: evt.refId,
        productShortId: evt.productShortId,
        offerId: evt.offerId,
      })
      .onConflictDoNothing()
      .returning({ transactionId: caktoPurchasesTable.transactionId });

    if (inserted.length === 0) {
      // Transação já registrada. Estornada → terminal; paga → duplicado puro.
      const existing = await tx
        .select({ status: caktoPurchasesTable.status })
        .from(caktoPurchasesTable)
        .where(eq(caktoPurchasesTable.transactionId, transactionId));
      if (existing[0] && existing[0].status !== "paid") {
        return { result: "purchase_already_revoked" } as const;
      }
      return { result: "duplicate_ignored" } as const;
    }

    const change = await recalculateEntitlement(tx, email);
    return { result: "purchase_recorded", commercialType, ...change } as const;
  });
}

export type RevocationOutcome =
  | ({ result: "purchase_revoked"; newStatus: PurchaseStatus } & PlanChange)
  | ({ result: "revocation_recorded_without_purchase"; newStatus: PurchaseStatus } & PlanChange)
  | { result: "duplicate_ignored" }
  | { result: "purchase_not_found" }
  | { result: "unknown_product" };

/**
 * Processa refund/chargeback: marca a compra original (por data.id) com o
 * status terminal e recalcula o entitlement do e-mail.
 *
 * Idempotência: se a compra já está no status alvo, "duplicate_ignored"
 * (timestamps não são sobrescritos).
 *
 * Fora de ordem: se o estorno chegar ANTES do purchase_approved (retry da
 * Cakto), e o payload trouxer e-mail + produto conhecido, a compra é criada
 * já no status terminal — assim um approved atrasado não concede acesso.
 * Sem dados suficientes para isso → "purchase_not_found" (log controlado,
 * nenhuma alteração de entitlement; nunca associar por nome/preço/e-mail).
 */
export async function processRevocation(
  evt: CaktoEvent,
  kind: "refund" | "chargeback",
): Promise<RevocationOutcome> {
  const transactionId = evt.transactionId as string;
  const newStatus: PurchaseStatus = kind === "refund" ? "refunded" : "chargeback";
  const tsField = kind === "refund" ? "refundedAt" : "chargedbackAt";
  // Timestamp do payload quando fornecido; hora de recebimento como fallback.
  const eventTime =
    parseTimestamp(kind === "refund" ? evt.refundedAt : evt.chargedbackAt) ??
    new Date();

  return db.transaction(async (tx) => {
    // 1) Descobre o e-mail dono da transação — leitura provisória, apenas
    // para saber qual advisory lock adquirir. O estado será relido depois.
    const peek = await tx
      .select({ email: caktoPurchasesTable.email })
      .from(caktoPurchasesTable)
      .where(eq(caktoPurchasesTable.transactionId, transactionId));

    const payloadEmail = evt.customerEmail?.trim().toLowerCase() || null;
    const email = peek[0]?.email ?? payloadEmail;
    if (!email) {
      // Sem compra registrada e sem e-mail no payload: nada seguro a fazer.
      return { result: "purchase_not_found" } as const;
    }

    // 2) Serializa por e-mail (mesma ordem de lock do fluxo de compra).
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${email}))`);

    // 3) Relê o estado ATUAL sob o lock — decisões só a partir daqui.
    const rows = await tx
      .select({
        email: caktoPurchasesTable.email,
        status: caktoPurchasesTable.status,
      })
      .from(caktoPurchasesTable)
      .where(eq(caktoPurchasesTable.transactionId, transactionId))
      .for("update");
    const current = rows[0] ?? null;

    if (current === null) {
      // Fora de ordem: estorno antes do purchase_approved. Só registra se o
      // payload identificar com segurança e-mail + produto conhecido — nunca
      // associar por nome/preço/e-mail apenas.
      const commercialType = evt.productId
        ? resolveCommercialType(evt.productId)
        : null;
      if (!payloadEmail || !evt.productId) {
        return { result: "purchase_not_found" } as const;
      }
      if (commercialType === null) {
        return { result: "unknown_product" } as const;
      }
      await tx.insert(caktoPurchasesTable).values({
        transactionId,
        email: payloadEmail,
        productId: evt.productId,
        commercialType,
        status: newStatus,
        [tsField]: eventTime,
        refId: evt.refId,
        productShortId: evt.productShortId,
        offerId: evt.offerId,
      });
      const change = await recalculateEntitlement(tx, payloadEmail);
      return {
        result: "revocation_recorded_without_purchase",
        newStatus,
        ...change,
      } as const;
    }

    // 4) Estados terminais são imutáveis: refund/chargeback repetido — ou o
    // outro terminal chegando depois — não sobrescreve status nem timestamps.
    if (current.status !== "paid") {
      return { result: "duplicate_ignored" } as const;
    }

    await tx
      .update(caktoPurchasesTable)
      .set({ status: newStatus, [tsField]: eventTime, updatedAt: sql`now()` })
      .where(eq(caktoPurchasesTable.transactionId, transactionId));

    const change = await recalculateEntitlement(tx, current.email);
    return { result: "purchase_revoked", newStatus, ...change } as const;
  });
}
