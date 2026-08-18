import { db, caktoEntitlementsTable, caktoProcessedEventsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { logger } from "../lib/logger";
import type { CaktoEvent } from "./cakto";

/**
 * Lógica de planos da integração Cakto.
 *
 * Planos válidos: "essential" e "deluxe". "upgrade" é um PRODUTO da Cakto
 * (essential → deluxe), nunca um plano gravado.
 *
 * Hierarquia monotônica: sem plano < essential < deluxe.
 * Um webhook posterior/duplicado/fora de ordem nunca reduz o plano.
 */

export type Plan = "essential" | "deluxe";

const PLAN_RANK: Record<Plan, number> = { essential: 1, deluxe: 2 };

/** Ação de produto mapeada a partir de data.product.id (fonte canônica). */
export type ProductAction =
  | { kind: "grant"; plan: Plan }
  | { kind: "upgrade" } // essential → deluxe
  | { kind: "unknown" };

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

/** Resolve a ação a partir do product.id recebido. */
export function resolveProductAction(productId: string): ProductAction {
  if (productId === process.env["CAKTO_PRODUCT_ESSENTIAL_ID"]) {
    return { kind: "grant", plan: "essential" };
  }
  if (productId === process.env["CAKTO_PRODUCT_DELUXE_ID"]) {
    return { kind: "grant", plan: "deluxe" };
  }
  if (productId === process.env["CAKTO_PRODUCT_UPGRADE_ID"]) {
    return { kind: "upgrade" };
  }
  return { kind: "unknown" };
}

export type ProcessOutcome =
  | { result: "plan_activated"; previousPlan: null; resultingPlan: Plan }
  | { result: "plan_upgraded"; previousPlan: Plan; resultingPlan: Plan }
  | { result: "plan_unchanged"; previousPlan: Plan; resultingPlan: Plan }
  | { result: "duplicate_ignored" }
  | { result: "unknown_product" }
  | { result: "upgrade_without_base_plan" };

/**
 * Processa uma compra aprovada (já autenticada e validada) de forma
 * idempotente e monotônica, dentro de uma transação:
 *
 * 1. Reserva data.id em cakto_processed_events (ON CONFLICT DO NOTHING).
 *    Conflito → evento duplicado → "duplicate_ignored", sem efeitos.
 * 2. Resolve o produto → essential | deluxe | upgrade | desconhecido.
 * 3. Aplica a regra monotônica sobre o entitlement do e-mail normalizado.
 *
 * Casos sem efeito no plano (produto desconhecido, upgrade sem plano base)
 * NÃO consomem a chave de idempotência — se o produto for cadastrado depois
 * ou o plano base chegar, um reenvio da Cakto poderá ser processado.
 */
export async function processApprovedPurchase(
  evt: CaktoEvent,
): Promise<ProcessOutcome> {
  // Campos garantidos por validatePurchaseApproved antes desta chamada.
  const transactionId = evt.transactionId as string;
  const productId = evt.productId as string;
  const email = (evt.customerEmail as string).trim().toLowerCase();

  const action = resolveProductAction(productId);
  if (action.kind === "unknown") {
    return { result: "unknown_product" };
  }

  return db.transaction(async (tx) => {
    // 0) Serializa processamento por e-mail (mesmo sem linha existente),
    // evitando corrida entre duas compras simultâneas de um e-mail novo.
    // Lock é liberado automaticamente no fim da transação.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${email}))`);

    // 1) Plano atual (lock da linha para evitar corrida entre webhooks).
    const rows = await tx
      .select()
      .from(caktoEntitlementsTable)
      .where(eq(caktoEntitlementsTable.email, email))
      .for("update");
    const previousPlan: Plan | null = rows[0]?.plan ?? null;

    // 2) Plano alvo segundo o produto.
    let targetPlan: Plan;
    if (action.kind === "grant") {
      targetPlan = action.plan;
    } else {
      // upgrade: exclusivamente essential → deluxe.
      if (previousPlan === null) {
        // Sem plano base: não inventar estado; não consumir a chave de
        // idempotência, para permitir reprocessamento quando o plano base
        // existir (reenvio da Cakto).
        return { result: "upgrade_without_base_plan" } as const;
      }
      targetPlan = "deluxe";
    }

    // 3) Idempotência: reserva data.id; conflito → evento duplicado.
    const inserted = await tx
      .insert(caktoProcessedEventsTable)
      .values({ transactionId, event: evt.event, productId, email })
      .onConflictDoNothing()
      .returning({ transactionId: caktoProcessedEventsTable.transactionId });

    if (inserted.length === 0) {
      return { result: "duplicate_ignored" } as const;
    }

    // 4) Monotônico: só sobe, nunca desce.
    const resultingPlan: Plan =
      previousPlan !== null && PLAN_RANK[previousPlan] >= PLAN_RANK[targetPlan]
        ? previousPlan
        : targetPlan;

    if (previousPlan === null) {
      await tx
        .insert(caktoEntitlementsTable)
        .values({ email, plan: resultingPlan });
      return {
        result: "plan_activated",
        previousPlan: null,
        resultingPlan,
      } as const;
    }

    if (resultingPlan !== previousPlan) {
      await tx
        .update(caktoEntitlementsTable)
        .set({ plan: resultingPlan, updatedAt: sql`now()` })
        .where(eq(caktoEntitlementsTable.email, email));
      return { result: "plan_upgraded", previousPlan, resultingPlan } as const;
    }

    return { result: "plan_unchanged", previousPlan, resultingPlan } as const;
  });
}
