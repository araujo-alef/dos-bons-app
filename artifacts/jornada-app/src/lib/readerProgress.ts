/**
 * Reading progress repository — localStorage-backed.
 * Replace the read/write functions here to switch to a backend/Firebase
 * without touching BookReader.
 *
 * Progress anchors to the ORIGINAL authored (pageId, blockIdx) of the first
 * block the reader was looking at — not a page index. Page indices are
 * recomputed per device (see src/lib/pagination.ts), so persisting one
 * directly would resume a phone's position on a tablet's completely
 * different page layout. blockIdx -1 means "the lesson's cover".
 */

export interface ProgressAnchor {
  pageId:   number;
  blockIdx: number;
}

const key = (lessonId: number) => `jornada_progress_lesson${lessonId}`;

export function saveProgress(lessonId: number, anchor: ProgressAnchor): void {
  try { localStorage.setItem(key(lessonId), JSON.stringify(anchor)); } catch {}
}

export function loadProgress(lessonId: number): ProgressAnchor | null {
  try {
    const raw = localStorage.getItem(key(lessonId));
    if (raw === null) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.pageId !== 'number' || typeof parsed?.blockIdx !== 'number') return null;
    return parsed as ProgressAnchor;
  } catch { return null; }
}

/** Wipes every lesson's saved position — called once the reader has been
 *  paged all the way through the last lesson, so reopening the book starts
 *  over from its very first page instead of resuming mid-lesson-1 (where
 *  the first lesson's own progress was last left, before the reader moved
 *  on into later lessons). */
export function clearAllProgress(lessonIds: number[]): void {
  try { lessonIds.forEach(id => localStorage.removeItem(key(id))); } catch {}
}
