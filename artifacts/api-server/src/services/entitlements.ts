import { db, caktoEntitlementsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { Plan } from "./caktoPlans";

/** Normalização canônica de e-mail — a MESMA usada pelo webhook Cakto. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Fonte de verdade do plano comprado: tabela cakto_entitlements.
 * Retorna "essential" | "deluxe" | null (sem compra).
 */
export async function getPlanByEmail(email: string): Promise<Plan | null> {
  const normalized = normalizeEmail(email);
  const rows = await db
    .select({ plan: caktoEntitlementsTable.plan })
    .from(caktoEntitlementsTable)
    .where(eq(caktoEntitlementsTable.email, normalized))
    .limit(1);
  return rows[0]?.plan ?? null;
}
