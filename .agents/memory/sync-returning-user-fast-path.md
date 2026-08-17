---
name: Sync returning-user fast path
description: Why performInitialSync short-circuits for same-device returning users, and the tradeoff to keep in mind.
---

## The rule
In `firestoreSync.ts → performInitialSync`, if `storedUid === uid` (sentinel matches), return immediately without any Firestore fetch. `syncReady` becomes true almost instantly.

**Why:** With `RequireAuthOnly` on the Home route, the user can navigate to a lesson before the sync finishes. The lesson route uses the full `RequireAuth` (blocks on `syncReady`), causing a visible spinner after the book-expansion animation. The fast-path eliminates this by skipping the network round-trip for returning users whose localStorage is already populated.

**The tradeoff:** Cross-device sync is not handled — edits made on device B will not appear on device A until a different user logs in and the sentinel changes. When cross-device sync matters, replace the early-return with a background fetch that merges Firestore state without blocking the UI.

**How to apply:** Touch this logic whenever changing the sync strategy, adding real-time listeners, or implementing a "sync on focus" pattern.
