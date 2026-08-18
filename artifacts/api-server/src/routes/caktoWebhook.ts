import { Router, type IRouter } from "express";
import { logger } from "../lib/logger";
import {
  parseCaktoEvent,
  verifyCaktoAuthenticity,
  maskEmail,
} from "../services/cakto";

const router: IRouter = Router();

/**
 * POST /api/webhooks/cakto
 *
 * Etapa 1 da integração Cakto: recebe o evento, valida o formato básico,
 * loga de forma segura e responde 200 imediatamente. Nenhum efeito
 * colateral (Firebase, planos, checkout) nesta etapa.
 */
router.post("/webhooks/cakto", (req, res) => {
  const parsed = parseCaktoEvent(req.body);

  if (!parsed.ok) {
    logger.warn({ error: parsed.error }, "cakto-webhook: invalid payload");
    res.status(400).json({ ok: false, error: parsed.error });
    return;
  }

  const auth = verifyCaktoAuthenticity(parsed.event.raw, req.headers);
  if (!auth.ok) {
    logger.warn({ reason: auth.reason }, "cakto-webhook: rejected");
    res.status(401).json({ ok: false, error: "unauthorized" });
    return;
  }

  const { event, transactionId, product, customerEmail } = parsed.event;

  // Log seguro: apenas os campos de interesse, e-mail mascarado, sem
  // despejar o payload completo (pode conter CPF, telefone, etc).
  logger.info(
    {
      source: "cakto",
      event,
      transactionId,
      product,
      customerEmail: maskEmail(customerEmail),
      authMode: auth.reason,
      receivedAt: new Date().toISOString(),
    },
    "cakto-webhook: event received",
  );

  res.status(200).json({ ok: true });
});

export default router;
