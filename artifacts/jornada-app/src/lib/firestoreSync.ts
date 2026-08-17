/**
 * Initial Firestore ↔ localStorage synchronisation.
 *
 * Called once per login, before any protected route becomes accessible.
 *
 * ── UID sentinel ────────────────────────────────────────────────────────────
 * localStorage is NOT namespaced by uid — the same keys are reused across
 * all users on the same browser. To prevent User B from inheriting User A's
 * cached data (and from having that data mistakenly migrated to B's Firestore
 * account), we store the uid that last populated the cache under
 * SESSION_UID_KEY. On every login we compare the incoming uid against the
 * stored one: if they differ (or if the key is absent), we wipe the local
 * cache before proceeding so B always starts from a clean slate.
 *
 * ── Sync paths ──────────────────────────────────────────────────────────────
 * After the cache is guaranteed to belong to the current user:
 *
 *   MIGRATE  — Firestore is empty, localStorage has data.
 *              First login with pre-existing local activity: push to Firestore.
 *              localStorage is NOT cleared until Firestore confirms the write.
 *
 *   RESTORE  — Firestore has data (returning user / second device).
 *              Overwrite localStorage with Firestore state. Firestore wins.
 *
 *   NO-OP    — Both empty. Fresh account on a fresh device.
 *
 * ── clearLocalSession ───────────────────────────────────────────────────────
 * Called on sign-out to immediately evict the cached data. Protects against
 * the "different user picks up the same device" scenario even in the brief
 * window before onAuthStateChanged fires for the new user's login.
 */

import {
  loadAllHighlightsRemote,
  loadAllProgressRemote,
  saveHighlightsRemote,
  saveProgressRemote,
} from '@/lib/firestoreService';
import {
  getAllLocalHighlights,
  restoreLocalHighlights,
  clearLocalHighlightsCache,
} from '@/lib/highlights';
import {
  getAllLocalProgress,
  restoreLocalProgress,
  clearLocalProgressCache,
} from '@/lib/readerProgress';

// ── Sentinel ─────────────────────────────────────────────────────────────────

const SESSION_UID_KEY = 'jornada_session_uid';

function getStoredSessionUid(): string | null {
  try { return localStorage.getItem(SESSION_UID_KEY); } catch { return null; }
}

function setStoredSessionUid(uid: string): void {
  try { localStorage.setItem(SESSION_UID_KEY, uid); } catch {}
}

function clearStoredSessionUid(): void {
  try { localStorage.removeItem(SESSION_UID_KEY); } catch {}
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Evicts all user-scoped localStorage cache entries.
 * Called on sign-out so no residue remains for the next user.
 * Never touches Firestore.
 */
export function clearLocalSession(): void {
  clearLocalHighlightsCache();
  clearLocalProgressCache();
  clearStoredSessionUid();
}

/**
 * Runs once per login. Ensures localStorage reflects the current user's
 * Firestore state before any protected route becomes accessible.
 */
export async function performInitialSync(uid: string): Promise<void> {
  // ── Guard: evict a different user's cache ─────────────────────────────────
  const storedUid = getStoredSessionUid();
  if (storedUid !== uid) {
    // Either a new user on this device, or the first time we track the uid.
    // Either way, the existing cache must not be used or migrated.
    clearLocalHighlightsCache();
    clearLocalProgressCache();
    // (sentinel is stale/absent — we set it at the end of a successful sync)
  }

  // ── Fetch Firestore state for both stores in parallel (4 s timeout) ────────
  // If Firestore is slow (cold start, poor connectivity) we proceed with
  // whatever is already in localStorage rather than blocking the user.
  const SYNC_TIMEOUT_MS = 4_000;

  const withTimeout = <T,>(promise: Promise<T>, fallback: T): Promise<T> =>
    Promise.race([
      promise,
      new Promise<T>(resolve => setTimeout(() => resolve(fallback), SYNC_TIMEOUT_MS)),
    ]);

  const [remoteHighlights, remoteProgress] = await Promise.all([
    withTimeout(loadAllHighlightsRemote(uid), []),
    withTimeout(loadAllProgressRemote(uid), {}),
  ]);

  // ── Highlights ─────────────────────────────────────────────────────────────
  const localHighlights = getAllLocalHighlights();

  if (remoteHighlights.length === 0 && localHighlights.length > 0) {
    // First login with pre-existing local data → migrate to Firestore.
    // localStorage is untouched; data is safe even if this write fails.
    await saveHighlightsRemote(uid, localHighlights);
  } else if (remoteHighlights.length > 0) {
    // Returning user (or second device) → restore Firestore data to localStorage.
    restoreLocalHighlights(remoteHighlights);
  }
  // else: both empty — nothing to do.

  // ── Reading progress ────────────────────────────────────────────────────────
  const localProgress     = getAllLocalProgress();
  const hasLocalProgress  = Object.keys(localProgress).length > 0;
  const hasRemoteProgress = Object.keys(remoteProgress).length > 0;

  if (!hasRemoteProgress && hasLocalProgress) {
    // First login: migrate each lesson's progress to Firestore in parallel.
    await Promise.all(
      Object.entries(localProgress).map(([lessonId, anchor]) =>
        saveProgressRemote(uid, Number(lessonId), anchor),
      ),
    );
  } else if (hasRemoteProgress) {
    // Returning user: restore Firestore progress to localStorage.
    restoreLocalProgress(remoteProgress);
  }

  // ── Stamp the sentinel ────────────────────────────────────────────────────
  // Only written after a successful sync so an interrupted sync does not
  // leave a stale sentinel that suppresses the next eviction.
  setStoredSessionUid(uid);
}
