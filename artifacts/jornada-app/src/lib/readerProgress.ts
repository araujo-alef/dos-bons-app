/**
 * Reading progress repository.
 *
 * Storage strategy:
 *   • localStorage — written synchronously (keeps the reader instant).
 *   • Firestore    — written in the background when authenticated.
 *
 * Progress anchors to the ORIGINAL authored (pageId, blockIdx) of the first
 * block the reader was looking at — not a page index. Page indices are
 * recomputed per device (see src/lib/pagination.ts), so persisting one
 * directly would resume a phone's position on a tablet's completely
 * different page layout. blockIdx -1 means "the lesson's cover".
 *
 * Migration / initial restore is handled by src/lib/firestoreSync.ts,
 * which pre-populates localStorage from Firestore before any protected
 * route becomes accessible.
 */

import { getActiveSyncUid }   from '@/lib/syncStore';
import { saveProgressRemote } from '@/lib/firestoreService';

export interface ProgressAnchor {
  pageId:   number;
  blockIdx: number;
}

const PREFIX   = 'jornada_progress_lesson';
const localKey = (lessonId: number) => `${PREFIX}${lessonId}`;

// ── localStorage primitives ──────────────────────────────────────────────────

function writeLocalProgress(lessonId: number, anchor: ProgressAnchor): void {
  try { localStorage.setItem(localKey(lessonId), JSON.stringify(anchor)); } catch {}
}

// ── Migration helpers (used by firestoreSync.ts only) ───────────────────────

/** Returns all locally stored progress entries — for migration. */
export function getAllLocalProgress(): Record<number, ProgressAnchor> {
  const result: Record<number, ProgressAnchor> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k?.startsWith(PREFIX)) continue;
      const lessonId = parseInt(k.slice(PREFIX.length), 10);
      if (isNaN(lessonId)) continue;
      const raw    = localStorage.getItem(k);
      const parsed = raw ? JSON.parse(raw) : null;
      if (typeof parsed?.pageId === 'number' && typeof parsed?.blockIdx === 'number') {
        result[lessonId] = parsed as ProgressAnchor;
      }
    }
  } catch {}
  return result;
}

/** Writes a map of Firestore progress back into localStorage — used when
 *  restoring on login. Does NOT trigger a Firestore write. */
export function restoreLocalProgress(progress: Record<number, ProgressAnchor>): void {
  for (const [lessonId, anchor] of Object.entries(progress)) {
    writeLocalProgress(Number(lessonId), anchor);
  }
}

/** Removes all progress keys from localStorage.
 *  Called on logout and on login when a different user is detected.
 *  Does NOT touch Firestore. */
export function clearLocalProgressCache(): void {
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(PREFIX)) toRemove.push(k);
    }
    toRemove.forEach(k => localStorage.removeItem(k));
  } catch {}
}

// ── public API ───────────────────────────────────────────────────────────────

export function saveProgress(lessonId: number, anchor: ProgressAnchor): void {
  writeLocalProgress(lessonId, anchor);
  const uid = getActiveSyncUid();
  if (uid) saveProgressRemote(uid, lessonId, anchor).catch(() => {});
}

export function loadProgress(lessonId: number): ProgressAnchor | null {
  try {
    const raw = localStorage.getItem(localKey(lessonId));
    if (raw === null) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.pageId !== 'number' || typeof parsed?.blockIdx !== 'number') return null;
    return parsed as ProgressAnchor;
  } catch { return null; }
}

/** Wipes every lesson's saved position — called once the reader has been
 *  paged all the way through the last lesson, so reopening the book starts
 *  over from its very first page instead of resuming mid-lesson-1. */
export function clearAllProgress(lessonIds: number[]): void {
  try { lessonIds.forEach(id => localStorage.removeItem(localKey(id))); } catch {}
  // No Firestore call here: clearAllProgress is a "book completed" reset
  // that will be handled when the Firestore progress story is fully built out.
}
