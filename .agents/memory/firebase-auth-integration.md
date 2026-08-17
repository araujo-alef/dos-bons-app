---
name: Firebase Auth integration
description: How Firebase Auth and Firestore are wired into jornada-app — key decisions and gotchas.
---

## What was done

- `artifacts/jornada-app/src/lib/firebase.ts` — initialises Firebase from `VITE_FIREBASE_*` Replit Secrets (never hardcoded). Sets `browserLocalPersistence` explicitly.
- `artifacts/jornada-app/src/lib/firestoreService.ts` — async CRUD for `users/{uid}`, `users/{uid}/progress/{lessonId}`, `users/{uid}/highlights/{id}`. Notes are embedded in highlights (`note` field), no separate collection.
- `artifacts/jornada-app/src/context/AuthContext.tsx` — `AuthProvider` + `useAuth` hook. Exports `toAuthError()` for Portuguese error messages.
- `artifacts/jornada-app/src/components/ProtectedRoute.tsx` — `RequireAuth` component; shows spinner while `loading=true` (Firebase resolving persisted session), then redirects to `/login` if unauthenticated.
- Auth pages: `/login`, `/cadastro`, `/recuperar-senha`.
- `App.tsx` — `AuthProvider` wraps everything. `/jornada/*` routes use `RequireAuth`. `/` (Home) is public.
- `AppHeader.tsx` — shows user initial avatar + dropdown with "Sair" when logged in.

## Key decisions

**Why `loading` guard matters:** Firebase resolves the persisted session asynchronously on mount. Without it, every protected route would flash a redirect to `/login` on hard refresh.

**Why Firestore service is async-only:** The existing localStorage-backed `highlights.ts` and `readerProgress.ts` are sync. They were intentionally left untouched — the Firestore service is the async layer ready to replace them. Wiring them together is the next task.

**Why notes are in highlights:** `BookHighlight` already has `note?: string`. A note is a highlight with text — no separate collection needed.

**pnpm 11 build approvals:** `@firebase/util` and `protobufjs` needed to be added to both `onlyBuiltDependencies` and `allowBuilds: true` in `pnpm-workspace.yaml`. The `.npmrc` `allow-build` key was insufficient for scoped packages.

**VITE_* secrets:** Firebase client config is set as Replit Secrets with `VITE_` prefix. Vite exposes `VITE_*` env vars to the browser bundle. The workflow must be restarted after secrets are added for Vite to pick them up.

## What remains

- Wire `highlights.ts` and `readerProgress.ts` to Firestore (replace localStorage primitives when user is authenticated).
- Home page `JOURNEY_STATE` / `CURRENT_LESSON_ID` constants in `readerProgress.ts` should be driven by Firestore progress data per user.
- Watermark (`mockWatermarkIdentity`) could use `user.uid` / `user.email` instead of mock identity.
