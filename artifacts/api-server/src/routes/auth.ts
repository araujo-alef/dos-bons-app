import { Router, type IRouter } from "express";
import { logger } from "../lib/logger";
import { verifyFirebaseIdToken } from "../lib/firebaseToken";
import { getPlanByEmail, normalizeEmail } from "../services/entitlements";
import { maskEmail } from "../services/cakto";

const router: IRouter = Router();

/**
 * POST /api/auth/registration-eligibility
 *
 * Fonte de verdade (backend) para o cadastro: só e-mails com entitlement
 * Cakto podem criar conta. O frontend consulta este endpoint ANTES de criar
 * o usuário no Firebase; a resposta não revela o plano, apenas elegibilidade.
 */
router.post("/auth/registration-eligibility", async (req, res) => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const email = typeof body["email"] === "string" ? body["email"] : "";
  if (!email || !email.includes("@")) {
    res.status(400).json({ ok: false, error: "invalid email" });
    return;
  }

  try {
    const plan = await getPlanByEmail(email);
    const eligible = plan !== null;
    logger.info(
      { email: maskEmail(normalizeEmail(email)), eligible },
      "auth: registration eligibility checked",
    );
    res.json({ ok: true, eligible });
  } catch (err) {
    logger.error({ err }, "auth: eligibility check failed");
    res.status(500).json({ ok: false, error: "eligibility check failed" });
  }
});

/**
 * GET /api/me/plan
 *
 * Retorna o plano do usuário autenticado (Bearer <Firebase ID token>).
 * O plano vem exclusivamente do backend (cakto_entitlements) — o frontend
 * nunca informa o próprio plano.
 */
router.get("/me/plan", async (req, res) => {
  const authHeader = req.headers.authorization ?? "";
  const idToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!idToken) {
    res.status(401).json({ authenticated: false, error: "missing token" });
    return;
  }

  let email: string | null;
  let emailVerified: boolean;
  try {
    ({ email, emailVerified } = await verifyFirebaseIdToken(idToken));
  } catch {
    res.status(401).json({ authenticated: false, error: "invalid token" });
    return;
  }

  if (!email) {
    res.json({ authenticated: true, plan: null, emailVerified: false });
    return;
  }

  // Nota: por decisão de produto (acesso restrito inicial), o e-mail NÃO
  // precisa estar verificado para o plano ser reconhecido. O campo
  // emailVerified é retornado apenas como informação adicional.

  try {
    const plan = await getPlanByEmail(email);
    res.json({ authenticated: true, plan, emailVerified });
  } catch (err) {
    logger.error({ err }, "auth: plan lookup failed");
    res.status(500).json({ authenticated: false, error: "plan lookup failed" });
  }
});

export default router;
