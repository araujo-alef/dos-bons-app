---
name: Cakto entitlement ↔ Firebase auth
description: How purchase entitlements gate registration and plan recognition; security invariants to preserve
---

- Fonte de verdade do plano comprado: tabela Postgres `cakto_entitlements` (e-mail normalizado `trim().toLowerCase()` → plan essential|deluxe). Nunca Firestore/frontend.
- **Why:** o frontend não pode definir o próprio plano; o webhook Cakto grava a compra por e-mail antes de existir conta Firebase.
- api-server verifica Firebase ID tokens SEM Admin SDK: `jose` + JWKS público do securetoken, issuer/audience = VITE_FIREBASE_PROJECT_ID. Suficiente para autenticar rotas; não checa revogação.
- Decisão de produto (ago/2026): `/api/me/plan` NÃO exige `email_verified` — usuário pediu remoção do atrito (acesso restrito inicial). Risco aceito e comunicado: quem souber o e-mail de um comprador sem conta pode criar a conta antes dele e herdar o plano. Campo `emailVerified` continua na resposta só como informação. Reintroduzir a exigência se o app abrir para público amplo.
- O gate de cadastro (`/api/auth/registration-eligibility`) é UX-preflight, não enforcement — contas criadas por fora ficam sem plano, então o conteúdo continua protegido.
- **How to apply:** ao implementar bloqueio de conteúdo, revogação (refund/chargeback) ou fluxos de conta, preservar: normalização única de e-mail, monotonicidade do plano, e a exigência de e-mail verificado.
