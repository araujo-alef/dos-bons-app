/**
 * Highlights repository — localStorage-backed.
 * Swap the read/write primitives below to connect to a backend
 * without changing any component.
 */

const STORE_KEY = 'jornada_highlights_v1';

export interface BookHighlight {
  id: string;
  chapterId: number;
  pageId: number;
  pageIndex: number;
  /** Index of the block within page.blocks (only text blocks are highlightable) */
  blockIdx: number;
  startOffset: number;
  endOffset: number;
  selectedText: string;
  note?: string;
  createdAt: string;
  updatedAt?: string;
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

export function loadHighlightsForPage(chapterId: number, pageId: number): BookHighlight[] {
  return readAll().filter(h => h.chapterId === chapterId && h.pageId === pageId);
}

/** All highlights sorted by book order (chapter → pageIndex → block → offset). */
export function loadAllHighlights(): BookHighlight[] {
  return readAll().sort((a, b) => {
    if (a.chapterId  !== b.chapterId)  return a.chapterId  - b.chapterId;
    if (a.pageIndex  !== b.pageIndex)  return a.pageIndex  - b.pageIndex;
    if (a.blockIdx   !== b.blockIdx)   return a.blockIdx   - b.blockIdx;
    return a.startOffset - b.startOffset;
  });
}

export function addHighlight(h: BookHighlight): void {
  const all = readAll();
  writeAll([...all, h]);
}

export function removeHighlight(id: string): void {
  writeAll(readAll().filter(h => h.id !== id));
}

export function patchHighlightNote(id: string, note: string): void {
  writeAll(readAll().map(h =>
    h.id === id ? { ...h, note, updatedAt: new Date().toISOString() } : h
  ));
}
