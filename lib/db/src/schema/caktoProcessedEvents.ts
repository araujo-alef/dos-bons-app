import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Idempotência do webhook Cakto: uma linha por compra processada,
 * chaveada por data.id (transactionId). Reenvio do mesmo evento → conflito
 * de chave → ignorado com "duplicate ignored".
 */
export const caktoProcessedEventsTable = pgTable("cakto_processed_events", {
  transactionId: text("transaction_id").primaryKey(),
  event: text("event").notNull(),
  productId: text("product_id"),
  email: text("email"),
  processedAt: timestamp("processed_at").notNull().defaultNow(),
});

export const insertCaktoProcessedEventSchema = createInsertSchema(
  caktoProcessedEventsTable,
).omit({ processedAt: true });
export type InsertCaktoProcessedEvent = z.infer<
  typeof insertCaktoProcessedEventSchema
>;
export type CaktoProcessedEvent = typeof caktoProcessedEventsTable.$inferSelect;
