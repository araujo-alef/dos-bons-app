/**
 * Module-level active-user store.
 *
 * Allows highlights.ts and readerProgress.ts to know the current uid
 * without becoming async or receiving uid as a parameter — preserving
 * their synchronous public API and keeping BookReader unchanged.
 *
 * Set by AuthContext immediately after Firebase resolves the user;
 * cleared on sign-out.
 */

let activeUid: string | null = null;

export function setActiveSyncUid(uid: string | null): void {
  activeUid = uid;
}

export function getActiveSyncUid(): string | null {
  return activeUid;
}
