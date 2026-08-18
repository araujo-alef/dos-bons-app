import { Router, type IRouter } from "express";
import { logger } from "../lib/logger";
import {
  parseCaktoEvent,
  validatePurchaseApproved,
  verifyCaktoAuthenticity,
  maskEmail,
} from "../services/cakto";

const router: IRouter = Router();

/**
 * POST /api/webhooks/cakto
 *
 * Recebe eventos da Cakto seguindo o modelo oficial de payload:
 * autentica via body.secret (quando CAKTO_WEBHOOK_SECRET está configurado),
 * valida campos obrigatórios de purchase_approved e loga com segurança.
 *
 * Sem efeitos colaterais ainda (Firebase, accessLevel, purchases) — a chave
 * futura de idempotência será data.id (transactionId) e o mapeamento de
 * acesso usará data.product.id como identificador canônico.
 */
router.post("/webhooks/cakto", (req, res) => {
  // 1) Autenticação SEMPRE primeiro (fail-closed): um request sem credencial
  // válida recebe 401 antes de qualquer validação de formato.
  const rawBody: Record<string, unknown> =
    req.body !== null && typeof req.body === "object" && !Array.isArray(req.body)
      ? (req.body as Record<string, unknown>)
      : {};

  // TODO(TEMP): log de depuração do 401 credential-mismatch — REMOVER depois.
  // Expõe secrets no log; não deixar em produção além do necessário.
  console.log({
    receivedSecret: (req.body as Record<string, unknown> | undefined)?.["secret"],
    expectedSecret: process.env["CAKTO_WEBHOOK_SECRET"],
    bodyHasSecret: Boolean((req.body as Record<string, unknown> | undefined)?.["secret"]),
    queryApiKey: req.query?.["api_key"],
    event: (req.body as Record<string, unknown> | undefined)?.["event"],
    productId: (req.body as { data?: { product?: { id?: unknown } } } | undefined)
      ?.data?.product?.id,
  });

  const auth = verifyCaktoAuthenticity(rawBody, req.headers);
  if (!auth.ok) {
    logger.warn(
      { mode: auth.mode, reason: auth.reason },
      "cakto-webhook: rejected",
    );
    res.status(401).json({ ok: false, error: "unauthorized" });
    return;
  }

  // 2) Só depois de autenticado, valida o formato do evento.
  const parsed = parseCaktoEvent(req.body);
  if (!parsed.ok) {
    logger.warn({ error: parsed.error }, "cakto-webhook: invalid payload");
    res.status(400).json({ ok: false, error: parsed.error });
    return;
  }

  const evt = parsed.event;

  // Validação mínima obrigatória para compras aprovadas.
  if (evt.event === "purchase_approved") {
    const problems = validatePurchaseApproved(evt);
    if (problems.length > 0) {
      logger.warn(
        { event: evt.event, transactionId: evt.transactionId, problems },
        "cakto-webhook: purchase_approved failed validation",
      );
      res.status(422).json({ ok: false, error: "invalid purchase_approved payload", problems });
      return;
    }
  }

  // Log seguro: somente campos permitidos, e-mail mascarado.
  // Nunca logar: secret, CPF, telefone, endereço, cartão, payload completo.
  logger.info(
    {
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
      receivedAt: new Date().toISOString(),
    },
    "cakto-webhook: event received",
  );

  res.status(200).json({ ok: true });
});

export default router;
