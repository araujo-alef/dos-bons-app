---
name: Firebase Auth + Firestore integration
description: How auth/sync of reader data works in jornada-app; Firestore is source of truth for progress+highlights
---

- Firebase Auth client-side (secrets `VITE_FIREBASE_*`, projeto `dos-bons-app`, plano Spark).
- Progresso de leitura + highlights: **Firestore é a fonte de verdade**; localStorage é cache por usuário/fallback offline. `users/{uid}/progress/{lessonId}` e `users/{uid}/highlights/{id}`.
- Progresso usa LWW por `updatedAtMs` (carimbo do cliente): merge no login compara timestamps sobre a UNIÃO local∪remoto (não só remoto); lições locais mais novas são reenviadas ao Firestore.
- **NÃO usar `runTransaction` para escritas de progresso** — `runTransaction` produz `failed-precondition` intermitente atrás de proxies (Replit, redes corporativas). Usar `setDoc` direto. LWW é resolvido no merge do login, não por transação em cada escrita.
- `initializeFirestore` com `experimentalAutoDetectLongPolling: true` (em `firebase.ts`) elimina erros 400/WebChannel no ambiente proxy do Replit.
- Escritas de progresso são debounced (2s) em `readerProgress.ts` com `flushPendingProgress()` (pagehide/hidden, saída do leitor, logout — logout AGUARDA o flush: `await flushPendingProgress()`) e `cancelPendingProgress()` em toda transição de auth (evita gravação cross-user).
- `performInitialSync` roda merge TODO login (mesmo uid incluso — traz edições de outro dispositivo); guardrail anti-corrida via `getActiveSyncUid() === uid` antes de cada mutação pós-await; sentinela `jornada_session_uid` só descarta cache quando PRESENTE e diferente de uid atual (ausente = dados legados → migrar, não apagar).
- Regras Firestore em `artifacts/jornada-app/firestore.rules` — publicação é passo MANUAL no console Firebase.
- pageId nas âncoras de progresso são IDs autorais do conteúdo do livro, NÃO índices sequenciais — testar migração requer âncora válida do conteúdo real.
- pnpm 11: builds de deps nativas exigem aprovação (`pnpm approve-builds`).
