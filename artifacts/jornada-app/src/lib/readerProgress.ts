/**
 * Reading progress repository — localStorage-backed.
 * Replace the read/write functions here to switch to a backend/Firebase
 * without touching BookReader.
 */

const key = (chapterId: number) => `jornada_progress_ch${chapterId}`;

export function saveProgress(chapterId: number, pageIndex: number): void {
  try { localStorage.setItem(key(chapterId), String(pageIndex)); } catch {}
}

export function loadProgress(chapterId: number): number {
  try {
    const raw = localStorage.getItem(key(chapterId));
    if (raw === null) return 0;
    const n = parseInt(raw, 10);
    return isNaN(n) ? 0 : n;
  } catch { return 0; }
}
