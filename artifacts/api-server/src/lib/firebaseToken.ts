import { createRemoteJWKSet, jwtVerify } from "jose";
import { logger } from "./logger";

/**
 * Verificação de Firebase ID tokens sem Admin SDK, usando as chaves públicas
 * do Google (securetoken). Suficiente para autenticar o usuário logado nas
 * rotas do api-server (não checa revogação de sessão — aceitável aqui).
 */

const projectId = process.env["VITE_FIREBASE_PROJECT_ID"];

const JWKS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
  ),
);

export interface VerifiedFirebaseUser {
  uid: string;
  email: string | null;
  emailVerified: boolean;
}

/** Valida a config no boot; loga apenas a chave ausente, nunca valores. */
export function validateFirebaseTokenConfig(): void {
  if (!projectId) {
    logger.error(
      "firebase-token: VITE_FIREBASE_PROJECT_ID not set — /api/me/plan will reject all requests",
    );
  }
}

/**
 * Verifica um Firebase ID token e retorna uid + e-mail.
 * Lança em caso de token inválido/expirado ou config ausente.
 */
export async function verifyFirebaseIdToken(
  idToken: string,
): Promise<VerifiedFirebaseUser> {
  if (!projectId) {
    throw new Error("firebase project id not configured");
  }
  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });
  const uid = typeof payload.sub === "string" ? payload.sub : "";
  if (!uid) throw new Error("token missing sub");
  const email = typeof payload["email"] === "string" ? payload["email"] : null;
  const emailVerified = payload["email_verified"] === true;
  return { uid, email, emailVerified };
}
