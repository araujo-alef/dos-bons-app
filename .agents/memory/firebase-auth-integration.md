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
       
  on sign-out → clearLocalSession() ← evicts localStorage cache immediately
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

### UID sentinel (firestoreSync.ts) — USER ISOLATION
- `jornada_session_uid` stored in localStorage after each successful sync
- On login: if stored uid ≠ incoming uid → wipe localStorage cache BEFORE sync
- On logout: `clearLocalSession()` wipes cache + sentinel immediately
- Guarantees User B never inherits User A's cached data

### Migration logic (firestoreSync.ts)
After the cache is guaranteed to belong to the current user:
- Firestore empty + localStorage has data → **migrate**: push local data to Firestore first
- Firestore has data → **restore**: overwrite localStorage with Firestore (Firestore wins)
- Both empty → no-op
- localStorage is NEVER cleared before Firestore write is confirmed

## Known limitations (by design)

**Firestore wins over newer localStorage:** If user makes progress offline then logs in again, the Firestore state (from last online session) overwrites the newer local state. Accepted trade-off; not changed.

**Progress Firestore write frequency:** BookReader has 300ms debounce before calling `saveProgress`. Each debounced save fires one Firestore document write. Acceptable for personal-app scale; worth revisiting at >100 concurrent users.

**`clearAllProgress` (book completed reset):** Only clears localStorage today. No Firestore counterpart yet.

## Key decisions

**Why `syncReady` blocks RequireAuth:** BookReader calls `loadAllHighlights()` and `loadProgress()` synchronously (in `useState` and `useLayoutEffect`). localStorage must be pre-populated from Firestore before the Reader mounts.

**Why `setActiveSyncUid` not a React context:** highlights.ts and readerProgress.ts are plain modules with synchronous APIs. Module-level singleton keeps the public API identical — BookReader is untouched.

**Why `export let mockWatermarkIdentity`:** ESM live binding — AuthContext calls `setWatermarkIdentity()` before `syncReady=true`, so BookReader reads the real identity on its first render without prop threading.

**`lessonId` is correct domain terminology** — the app uses "lição" in UI and routes (/jornada/licao/:id). Do not rename.

**`toAuthError` in its own file (`src/lib/authErrors.ts`):** Mixing React components and plain functions in the same module breaks Vite Fast Refresh.

**pnpm 11 build approvals:** `@firebase/util` and `protobufjs` must be in both `onlyBuiltDependencies` AND `allowBuilds: true` in `pnpm-workspace.yaml`.

**VITE_* secrets:** Workflow must be restarted after secrets are added for Vite to pick them up.

## Files

| File | Role |
|---|---|
| `src/lib/syncStore.ts` | Module-level uid singleton |
| `src/lib/firestoreSync.ts` | One-time migration/restore + uid sentinel + clearLocalSession |
| `src/lib/firestoreService.ts` | All Firestore CRUD (unchanged) |
| `src/lib/highlights.ts` | Dual-write + migration helpers + clearLocalHighlightsCache |
| `src/lib/readerProgress.ts` | Dual-write + migration helpers + clearLocalProgressCache |
| `src/lib/watermark.ts` | Live-binding identity for content protection |
| `src/lib/authErrors.ts` | Firebase code → Portuguese message |
| `src/context/AuthContext.tsx` | Auth state + sync orchestration + clearLocalSession on logout |
| `src/components/ProtectedRoute.tsx` | Blocks on loading AND syncReady |
