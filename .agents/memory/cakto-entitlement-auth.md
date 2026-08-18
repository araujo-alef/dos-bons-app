---
name: Cakto entitlement ↔ Firebase auth
description: How purchase entitlements gate registration and plan recognition; security invariants to preserve
---

- Fonte de verdade do plano comprado: tabela Postgres `cakto_entitlements` (e-mail normalizado `trim().toLowerCase()` → plan essential|deluxe). Nunca Firestore/frontend.
- **Why:** o frontend não pode definir o próprio plano; o webhook Cakto grava a compra por e-mail antes de existir conta Firebase.
- api-server verifica Firebase ID tokens SEM Admin SDK: `jose` + JWKS público do securetoken, issuer/audience = VITE_FIREBASE_PROJECT_ID. Suficiente para autenticar rotas; não checa revogação.
- Invariante de segurança: `/api/me/plan` só reconhece plano com `email_verified === true` no token. Sem isso, qualquer um que soubesse o e-mail de um comprador criaria conta com ele e herdaria o plano (a criação de conta client-side no Firebase não é bloqueável sem beforeCreate/Admin).
- O gate de cadastro (`/api/auth/registration-eligibility`) é UX-preflight, não enforcement — contas criadas por fora ficam sem plano, então o conteúdo continua protegido.
- **How to apply:** ao implementar bloqueio de conteúdo, revogação (refund/chargeback) ou fluxos de conta, preservar: normalização única de e-mail, monotonicidade do plano, e a exigência de e-mail verificado.
