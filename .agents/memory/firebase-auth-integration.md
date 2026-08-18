---
name: Firebase Auth + Firestore integration
description: How auth/sync of reader data works in jornada-app; Firestore is source of truth for progress+highlights
---

- Firebase Auth client-side (secrets `VITE_FIREBASE_*`, projeto `dos-bons-app`, plano Spark).
- Progresso de leitura + highlights: **Firestore é a fonte de verdade**; localStorage é cache por usuário/fallback offline. `users/{uid}/progress/{lessonId}` e `users/{uid}/highlights/{id}`.
- Progresso usa LWW por `updatedAtMs` (carimbo do cliente): gravação remota via `runTransaction` que descarta escritas mais antigas; merge no login sobre a união local∪remoto.
- Escritas de progresso são debounced (2s) em `readerProgress.ts` com `flushPendingProgress()` (pagehide/hidden, saída do leitor, logout — logout AGUARDA o flush antes do signOut) e `cancelPendingProgress()` em toda transição de auth (evita gravação cross-user).
- `performInitialSync` roda merge TODO login (mesmo uid incluso — é o que traz edições de outro dispositivo); guarda anti-corrida via `getActiveSyncUid() === uid` antes de cada mutação pós-await; sentinela `jornada_session_uid` só evita cache alheio quando PRESENTE e diferente (ausente = dados legados → migrar, não apagar).
- **Why:** code-review pegou 4 bugs reais nessa área (wipe de dados legados, merge que perdia lições locais, corrida de auth, flush não aguardado no logout) — mudanças aqui exigem revisar esses cenários.
- Regras Firestore em `artifacts/jornada-app/firestore.rules` (publicação é passo MANUAL no console).
- pnpm 11: builds de deps nativas exigem aprovação (`pnpm approve-builds`).
