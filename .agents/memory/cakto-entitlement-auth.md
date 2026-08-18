---
name: Cakto entitlement ↔ Firebase auth
description: How purchase entitlements gate registration and plan recognition; security invariants to preserve
---

- Modelo LEDGER (ago/2026): `cakto_purchases` é a fonte primária (uma linha por transação, status paid|refunded|chargeback, terminal imutável); `cakto_entitlements` é DERIVADO só das compras paid via recálculo em transação. Regra comercial: deluxe pago → deluxe; essential+upgrade pagos → deluxe; um dos dois → essential; nada → null (linha removida). Upgrade sozinho vale essential. `cakto_processed_events` não é mais escrita (histórico legado).
- Lock ordering: sempre advisory lock por e-mail ANTES de decidir estado; reler a compra FOR UPDATE sob o lock (leitura anterior é só para descobrir o e-mail). Estorno fora de ordem com e-mail+produto conhecidos cria a linha já terminal, para o approved atrasado não conceder acesso.
- **Why:** o frontend não pode definir o próprio plano; o webhook Cakto grava a compra por e-mail antes de existir conta Firebase.
- api-server verifica Firebase ID tokens SEM Admin SDK: `jose` + JWKS público do securetoken, issuer/audience = VITE_FIREBASE_PROJECT_ID. Suficiente para autenticar rotas; não checa revogação.
- Decisão de produto (ago/2026): `/api/me/plan` NÃO exige `email_verified` — usuário pediu remoção do atrito (acesso restrito inicial). Risco aceito e comunicado: quem souber o e-mail de um comprador sem conta pode criar a conta antes dele e herdar o plano. Campo `emailVerified` continua na resposta só como informação. Reintroduzir a exigência se o app abrir para público amplo.
- O gate de cadastro (`/api/auth/registration-eligibility`) é UX-preflight, não enforcement — contas criadas por fora ficam sem plano, então o conteúdo continua protegido.
- **How to apply:** ao implementar bloqueio de conteúdo, revogação (refund/chargeback) ou fluxos de conta, preservar: normalização única de e-mail, monotonicidade do plano, e a exigência de e-mail verificado.
