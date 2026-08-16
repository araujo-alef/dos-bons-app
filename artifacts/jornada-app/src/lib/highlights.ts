/**
 * Highlights repository — localStorage-backed.
 * Swap the read/write primitives below to connect to a backend
 * without changing any component.
 */

const STORE_KEY = 'jornada_highlights_v1';

export interface BookHighlight {
  id: string;
  lessonId: number;
  pageId: number;
  pageIndex: number;
  /** Index of the block within page.blocks (only text blocks are highlightable) */
  blockIdx: number;
  startOffset: number;
  endOffset: number;
  selectedText: string;
  /** Shared by every record of one multi-paragraph selection. A selection
   *  spanning N paragraphs is stored as N records (one per block, each with
   *  its own offsets) so per-block rendering stays trivial — this is what
   *  ties them back together for display and deletion. Absent on
   *  single-block highlights saved before this existed; use groupKey(). */
  groupId?: string;
  note?: string;
  createdAt: string;
  updatedAt?: string;
}

/** Identity of the logical highlight a record belongs to. Falls back to the
 *  record's own id so pre-groupId highlights behave as groups of one. */
export function groupKey(h: BookHighlight): string {
  return h.groupId ?? h.id;
}

// ── storage primitives ──────────────────────────────────────────────────────

function readAll(): BookHighlight[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? (JSON.parse(raw) as BookHighlight[]) : [];
  } catch { return []; }
}

function writeAll(list: BookHighlight[]): void {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); } catch {}
}

// ── public API ──────────────────────────────────────────────────────────────

export function loadHighlightsForPage(lessonId: number, pageId: number): BookHighlight[] {
  return readAll().filter(h => h.lessonId === lessonId && h.pageId === pageId);
}

/** All highlights sorted by book order (lesson → pageIndex → block → offset). */
export function loadAllHighlights(): BookHighlight[] {
  return readAll().sort((a, b) => {
    if (a.lessonId   !== b.lessonId)   return a.lessonId   - b.lessonId;
    if (a.pageIndex  !== b.pageIndex)  return a.pageIndex  - b.pageIndex;
    if (a.blockIdx   !== b.blockIdx)   return a.blockIdx   - b.blockIdx;
    return a.startOffset - b.startOffset;
  });
}

export function addHighlight(h: BookHighlight): void {
  const all = readAll();
  writeAll([...all, h]);
}

/** Persists one multi-paragraph selection (already sharing a groupId). */
export function addHighlights(list: BookHighlight[]): void {
  if (list.length === 0) return;
  writeAll([...readAll(), ...list]);
}

export function removeHighlight(id: string): void {
  writeAll(readAll().filter(h => h.id !== id));
}

/** Removes every record of a logical highlight — erasing any paragraph of a
 *  multi-paragraph selection removes the whole thing, never a fragment. */
export function removeHighlightGroup(key: string): void {
  writeAll(readAll().filter(h => groupKey(h) !== key));
}

export function patchHighlightNote(id: string, note: string): void {
  const now = new Date().toISOString();
  const all = readAll();
  const target = all.find(h => h.id === id);
  if (!target) return;
  // The note belongs to the logical highlight, not one of its paragraphs.
  const key = groupKey(target);
  writeAll(all.map(h => (groupKey(h) === key ? { ...h, note, updatedAt: now } : h)));
}

// ── cross-navigation: standalone Highlights page → reader ──────────────────
// Tapping a highlight on the full-page /jornada/destaques list navigates to
// the reader route, which is a different mount than the page the list lives
// on — a plain prop callback can't cross that boundary. sessionStorage
// carries the "jump to this exact block" intent across the navigation,
// mirroring the existing bookEntryTransition flag pattern.

const PENDING_JUMP_KEY = 'jornada_pending_highlight';

export interface PendingHighlightJump {
  lessonId:    number;
  pageId:      number;
  blockIdx:    number;
  highlightId: string;
}

export function setPendingHighlightJump(jump: PendingHighlightJump): void {
  try { sessionStorage.setItem(PENDING_JUMP_KEY, JSON.stringify(jump)); } catch {}
}

/** Reads and clears the pending jump — consumed at most once. */
export function consumePendingHighlightJump(): PendingHighlightJump | null {
  try {
    const raw = sessionStorage.getItem(PENDING_JUMP_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(PENDING_JUMP_KEY);
    const parsed = JSON.parse(raw);
    if (typeof parsed?.lessonId !== 'number' || typeof parsed?.pageId !== 'number' || typeof parsed?.blockIdx !== 'number') return null;
    return parsed as PendingHighlightJump;
  } catch { return null; }
}
