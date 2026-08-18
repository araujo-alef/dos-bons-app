import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Plano/entitlement por comprador (chave: e-mail normalizado, lowercase).
 * `plan` só pode ser "essential" ou "deluxe" — nunca "upgrade".
 * A hierarquia é monotônica: sem plano < essential < deluxe.
 */
export const caktoEntitlementsTable = pgTable("cakto_entitlements", {
  email: text("email").primaryKey(),
  plan: text("plan", { enum: ["essential", "deluxe"] }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCaktoEntitlementSchema = createInsertSchema(
  caktoEntitlementsTable,
).omit({ createdAt: true, updatedAt: true });
export type InsertCaktoEntitlement = z.infer<
  typeof insertCaktoEntitlementSchema
>;
export type CaktoEntitlement = typeof caktoEntitlementsTable.$inferSelect;
