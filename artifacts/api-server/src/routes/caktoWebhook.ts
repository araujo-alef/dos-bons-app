import { Router, type IRouter } from "express";
import { logger } from "../lib/logger";
import {
  parseCaktoEvent,
  validatePurchaseApproved,
  verifyCaktoAuthenticity,
  maskEmail,
} from "../services/cakto";
import { processApprovedPurchase, processRevocation } from "../services/caktoPlans";

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

  // 3) Eventos com efeito: purchase_approved, refund, chargeback.
  // Outros (PIX gerado, pendente, recusado, boleto, etc.) são só registrados.
  if (evt.event === "refund" || evt.event === "chargeback") {
    if (!evt.transactionId) {
      logger.warn(
        { ...safeFields, problems: ["missing_data_id"] },
        "cakto-webhook: revocation failed validation",
      );
      res.status(422).json({ ok: false, error: "invalid revocation payload" });
      return;
    }
    try {
      const outcome = await processRevocation(evt, evt.event);
      const logCtx =
        "previousPlan" in outcome
          ? { ...safeFields, previousPlan: outcome.previousPlan, resultingPlan: outcome.resultingPlan }
          : safeFields;
      switch (outcome.result) {
        case "purchase_revoked":
          logger.info(logCtx, "cakto-webhook: purchase revoked, entitlement recalculated");
          break;
        case "revocation_recorded_without_purchase":
          logger.warn(logCtx, "cakto-webhook: revocation for unseen purchase recorded");
          break;
        case "duplicate_ignored":
          logger.info(safeFields, "cakto-webhook: duplicate revocation ignored");
          break;
        case "purchase_not_found":
          logger.warn(safeFields, "cakto-webhook: revocation for unknown purchase (insufficient data)");
          break;
        case "unknown_product":
          logger.warn(safeFields, "cakto-webhook: revocation for unknown product");
          break;
      }
      res.status(200).json({ ok: true, result: outcome.result });
    } catch (err) {
      logger.error({ ...safeFields, err }, "cakto-webhook: revocation processing failed");
      res.status(500).json({ ok: false, error: "processing failed" });
    }
    return;
  }

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
      case "purchase_recorded":
        logger.info(
          {
            ...safeFields,
            commercialType: outcome.commercialType,
            previousPlan: outcome.previousPlan,
            resultingPlan: outcome.resultingPlan,
          },
          "cakto-webhook: purchase recorded, entitlement recalculated",
        );
        break;
      case "duplicate_ignored":
        logger.info(safeFields, "cakto-webhook: duplicate ignored");
        break;
      case "purchase_already_revoked":
        logger.warn(
          safeFields,
          "cakto-webhook: approved for already-revoked purchase ignored (terminal status)",
        );
        break;
      case "unknown_product":
        logger.warn(safeFields, "cakto-webhook: unknown product");
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
