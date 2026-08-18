import { Router, type IRouter } from "express";
import { logger } from "../lib/logger";
import {
  parseCaktoEvent,
  validatePurchaseApproved,
  verifyCaktoAuthenticity,
  maskEmail,
} from "../services/cakto";
import { processApprovedPurchase } from "../services/caktoPlans";

const router: IRouter = Router();

/**
 * POST /api/webhooks/cakto
 *
 * Recebe eventos da Cakto (contrato oficial), autentica via body.secret,
 * valida purchase_approved e aplica a lógica de planos de forma idempotente
 * e monotônica (sem plano < essential < deluxe; nunca downgrade).
 */
router.post("/webhooks/cakto", async (req, res) => {
  // 1) Autenticação SEMPRE primeiro (fail-closed).
  const rawBody: Record<string, unknown> =
    req.body !== null && typeof req.body === "object" && !Array.isArray(req.body)
      ? (req.body as Record<string, unknown>)
      : {};

  const auth = verifyCaktoAuthenticity(rawBody, req.headers);
  if (!auth.ok) {
    logger.warn(
      { mode: auth.mode, reason: auth.reason },
      "cakto-webhook: rejected",
    );
    res.status(401).json({ ok: false, error: "unauthorized" });
    return;
  }

  // 2) Formato do evento.
  const parsed = parseCaktoEvent(req.body);
  if (!parsed.ok) {
    logger.warn({ error: parsed.error }, "cakto-webhook: invalid payload");
    res.status(400).json({ ok: false, error: parsed.error });
    return;
  }

  const evt = parsed.event;

  // Campos seguros para todos os logs deste evento (nunca secret/payload completo).
  const safeFields = {
    source: "cakto",
    event: evt.event,
    transactionId: evt.transactionId,
    refId: evt.refId,
    productId: evt.productId,
    productShortId: evt.productShortId,
    productName: evt.productName,
    offerId: evt.offerId,
    customerEmail: maskEmail(evt.customerEmail),
    status: evt.status,
    authMode: auth.mode,
  };

  logger.info(safeFields, "cakto-webhook: event received");

  // 3) Somente purchase_approved altera plano/acesso. Outros eventos
  // (PIX gerado, pendente, recusado, boleto, etc.) são apenas registrados.
  if (evt.event !== "purchase_approved") {
    res.status(200).json({ ok: true, processed: false });
    return;
  }

  const problems = validatePurchaseApproved(evt);
  if (problems.length > 0) {
    logger.warn(
      { ...safeFields, problems },
      "cakto-webhook: purchase_approved failed validation",
    );
    res
      .status(422)
      .json({ ok: false, error: "invalid purchase_approved payload", problems });
    return;
  }

  // 4) Processamento idempotente da compra aprovada.
  try {
    const outcome = await processApprovedPurchase(evt);

    switch (outcome.result) {
      case "plan_activated":
        logger.info(
          { ...safeFields, previousPlan: null, resultingPlan: outcome.resultingPlan },
          "cakto-webhook: plan activated",
        );
        break;
      case "plan_upgraded":
        logger.info(
          { ...safeFields, previousPlan: outcome.previousPlan, resultingPlan: outcome.resultingPlan },
          "cakto-webhook: plan upgraded",
        );
        break;
      case "plan_unchanged":
        logger.info(
          { ...safeFields, previousPlan: outcome.previousPlan, resultingPlan: outcome.resultingPlan },
          "cakto-webhook: plan unchanged",
        );
        break;
      case "duplicate_ignored":
        logger.info(safeFields, "cakto-webhook: duplicate ignored");
        break;
      case "unknown_product":
        logger.warn(safeFields, "cakto-webhook: unknown product");
        break;
      case "upgrade_without_base_plan":
        logger.warn(safeFields, "cakto-webhook: upgrade without base plan");
        break;
    }

    // 200 em todos os casos tratados, para a Cakto não fazer retries
    // desnecessários (duplicado/produto desconhecido não são erros dela).
    res.status(200).json({ ok: true, result: outcome.result });
  } catch (err) {
    logger.error(
      { ...safeFields, err },
      "cakto-webhook: processing failed",
    );
    // 500 → Cakto reenvia; o processamento é idempotente, então retry é seguro.
    res.status(500).json({ ok: false, error: "processing failed" });
  }
});

export default router;
