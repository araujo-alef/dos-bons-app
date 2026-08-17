---
name: Firebase Auth integration
description: How Firebase Auth, Firestore, and the dual-write sync layer are wired into jornada-app.
---

## Architecture

```
onAuthStateChanged
  ├─ setActiveSyncUid(uid)          ← syncStore.ts: module-level uid singleton
  ├─ setWatermarkIdentity(...)      ← watermark.ts: live ESM binding, read at render time
  ├─ ensureUserProfile(uid)         ← firestoreService.ts: upsert users/{uid}
  └─ performInitialSync(uid)        ← firestoreSync.ts: Firestore → localStorage
       └─ setSyncReady(true)        ← RequireAuth unblocks, BookReader can mount
```

### Dual-write (every write after initial sync)
- `highlights.ts` → localStorage (sync, immediate) + Firestore (async, fire-and-forget)
- `readerProgress.ts` → same pattern
- Both read the active uid from `syncStore.ts` — no API changes to BookReader

### Initial sync state machine (AuthContext)
- `loading=true` → Firebase resolving persisted session
- `loading=false, !user` → redirect to /login
- `user, syncReady=false` → Firestore sync in progress (spinner)
- `user, syncReady=true` → children render, BookReader safe to mount

### Migration logic (firestoreSync.ts)
- Firestore empty + localStorage has data → **migrate**: push local data to Firestore first, then continue
- Firestore has data → **restore**: overwrite localStorage with Firestore (Firestore wins)
- Both empty → no-op
- localStorage is NEVER cleared before Firestore write is confirmed

## Key decisions

**Why syncReady blocks RequireAuth:** BookReader calls `loadAllHighlights()` and `loadProgress()` synchronously (in `useState` and `useLayoutEffect`). localStorage must be pre-populated from Firestore before the Reader mounts — otherwise it reads stale or wrong-user data.

**Why `setActiveSyncUid` not a React context:** highlights.ts and readerProgress.ts are plain modules with synchronous APIs. Passing uid as a parameter to every call site would require touching BookReader, BookPage, HighlightsPage, etc. The module-level singleton keeps the public API identical.

**Why `export let mockWatermarkIdentity`:** ESM live binding — AuthContext calls `setWatermarkIdentity()` before `syncReady=true`, so BookReader reads the real identity on its first render without any prop threading.

**`lessonId` is correct domain terminology** — the app uses "lição" in UI and routes (/jornada/licao/:id). Do not rename to "chapterId" or anything else.

**pnpm 11 build approvals:** `@firebase/util` and `protobufjs` must be in both `onlyBuiltDependencies` AND `allowBuilds: true` in `pnpm-workspace.yaml`. The `.npmrc` `allow-build` key is insufficient for scoped packages.

**`toAuthError` in its own file (`src/lib/authErrors.ts`):** Mixing React components and plain functions in the same module breaks Vite Fast Refresh. AuthContext exports only React things; utility functions go elsewhere.

**VITE_* secrets:** Workflow must be restarted after secrets are added for Vite to pick them up.

## Files

| File | Role |
|---|---|
| `src/lib/syncStore.ts` | Module-level uid singleton |
| `src/lib/firestoreSync.ts` | One-time migration/restore on login |
| `src/lib/firestoreService.ts` | All Firestore CRUD (unchanged) |
| `src/lib/highlights.ts` | Dual-write + migration helpers |
| `src/lib/readerProgress.ts` | Dual-write + migration helpers |
| `src/lib/watermark.ts` | Live-binding identity for content protection |
| `src/lib/authErrors.ts` | Firebase code → Portuguese message |
| `src/context/AuthContext.tsx` | Auth state + sync orchestration |
| `src/components/ProtectedRoute.tsx` | Blocks on loading AND syncReady |

## What remains

- Home page `JOURNEY_STATE` / `CURRENT_LESSON_ID` constants in `mocks/config.ts` — still hardcoded; could be driven by Firestore progress.
- `clearAllProgress` in readerProgress.ts — only clears localStorage today; a Firestore counterpart would need `clearAllProgressRemote`.
- Tela de perfil (/perfil) — proposed as follow-up task.
