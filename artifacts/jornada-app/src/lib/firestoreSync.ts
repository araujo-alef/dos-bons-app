/**
 * Initial Firestore ↔ localStorage synchronisation.
 *
 * Called once per login, before any protected route becomes accessible.
 * Decides between two paths:
 *
 *   MIGRATE  — Firestore is empty, localStorage has data.
 *              Push local data to Firestore; localStorage is left as-is.
 *              localStorage is NOT cleared until Firestore confirms the write,
 *              so data is never lost on a network failure.
 *
 *   RESTORE  — Firestore has data (returning user / second device).
 *              Overwrite localStorage with the Firestore state.
 *              Firestore is the source of truth; the local cache is refreshed.
 *
 * After this function resolves, localStorage reflects Firestore and
 * subsequent reads by BookReader (sync, via localStorage) are correct.
 * Subsequent writes go to both stores via the dual-write in
 * highlights.ts / readerProgress.ts.
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
} from '@/lib/highlights';
import {
  getAllLocalProgress,
  restoreLocalProgress,
} from '@/lib/readerProgress';

export async function performInitialSync(uid: string): Promise<void> {
  // Fetch Firestore state for both stores in parallel.
  const [remoteHighlights, remoteProgress] = await Promise.all([
    loadAllHighlightsRemote(uid),
    loadAllProgressRemote(uid),
  ]);

  // ── Highlights ─────────────────────────────────────────────────────────────
  const localHighlights = getAllLocalHighlights();

  if (remoteHighlights.length === 0 && localHighlights.length > 0) {
    // First login with pre-existing local data → migrate to Firestore.
    // localStorage is untouched; data is safe even if this write fails.
    await saveHighlightsRemote(uid, localHighlights);
  } else if (remoteHighlights.length > 0) {
    // Returning user (or second device) → restore Firestore data to localStorage.
    // Firestore wins; local cache is refreshed.
    restoreLocalHighlights(remoteHighlights);
  }
  // else: both empty — nothing to do.

  // ── Reading progress ────────────────────────────────────────────────────────
  const localProgress    = getAllLocalProgress();
  const hasLocalProgress = Object.keys(localProgress).length > 0;
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
}
