import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Ledger de compras Cakto — uma linha por transação (data.id).
 *
 * O entitlement em cakto_entitlements passa a ser DERIVADO deste ledger
 * (ver recalculateEntitlement): apenas compras com status "paid" contam.
 *
 * commercial_type: o que o produto representa comercialmente —
 *   essential | deluxe | upgrade (upgrade é complemento do essential;
 *   sozinho vale essential, junto com essential vale deluxe).
 *
 * status: paid → refunded/chargeback são terminais (um purchase_approved
 * reenviado nunca "ressuscita" uma compra estornada).
 */
export const caktoPurchasesTable = pgTable("cakto_purchases", {
  transactionId: text("transaction_id").primaryKey(),
  email: text("email").notNull(),
  productId: text("product_id").notNull(),
  commercialType: text("commercial_type", {
    enum: ["essential", "deluxe", "upgrade"],
  }).notNull(),
  status: text("status", {
    enum: ["paid", "refunded", "chargeback"],
  }).notNull(),
  paidAt: timestamp("paid_at"),
  refundedAt: timestamp("refunded_at"),
  chargedbackAt: timestamp("chargedback_at"),
  // Metadata de auditoria (sem dados pessoais além do e-mail já usado como chave de acesso).
  refId: text("ref_id"),
  productShortId: text("product_short_id"),
  offerId: text("offer_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCaktoPurchaseSchema = createInsertSchema(
  caktoPurchasesTable,
).omit({ createdAt: true, updatedAt: true });
export type InsertCaktoPurchase = z.infer<typeof insertCaktoPurchaseSchema>;
export type CaktoPurchase = typeof caktoPurchasesTable.$inferSelect;
