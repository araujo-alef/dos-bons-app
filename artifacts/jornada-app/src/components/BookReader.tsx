import { useRef, useState, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
import { BookPage } from './BookPage';
import { BookMeasurer } from './BookMeasurer';
import { ReaderToolbar, type ReaderMode } from './ReaderToolbar';
import { HighlightSelectionMenu } from './HighlightSelectionMenu';
import { HighlightToolPicker, type HighlightTool } from './HighlightToolPicker';
import { NoteEditor } from './NoteEditor';
import { ExitConfirmDialog } from './ExitConfirmDialog';
import { TouchSelectionOverlay, type LiveSelectionPart } from './TouchSelectionOverlay';
import { lessons, type Lesson } from '@/mocks/data';
import type { DynamicPage } from '@/lib/pagination';
import {
  type BookHighlight,
  addHighlights,
  removeHighlightGroup,
  groupKey,
  loadAllHighlights,
  consumePendingHighlightJump,
} from '@/lib/highlights';
import { saveProgress, loadProgress, flushPendingProgress, type ProgressAnchor } from '@/lib/readerProgress';
import { findAncestorWithAttr, getOffsetInBlock, offsetAtPoint } from '@/lib/textOffset';
import { useReaderContentProtection } from '@/hooks/useReaderContentProtection';
import { mockWatermarkIdentity } from '@/lib/watermark';

const IS_TOUCH_DEVICE = typeof window !== 'undefined' && 'ontouchstart' in window;

// ─── The whole book as one flat sequence ───────────────────────────────────────
// The reader never thinks in terms of "which lesson" — it thinks in terms of
// one continuous list of pages, built once per lesson from that lesson's
// dynamically-measured pagination (see BookMeasurer / lib/pagination.ts).
// Crossing from one lesson into the next during normal reading is then just
// "index + 1", the same as turning any other page. Where a page BREAKS
// within a lesson is recomputed for this device's actual screen — it is
// never the same fixed split for every device — so progress and highlights
// anchor to the block's ORIGINAL authored (pageId, blockIdx) instead of a
// page index; see findFlatIndexForAnchor below.
interface FlatPageEntry {
  lesson:     Lesson;
  content:    DynamicPage;
  /** Position of this page within its own lesson's computed pages (0 =
   *  cover) — purely for UI/navigation, never persisted. */
  localIndex: number;
}

function findLessonStart(entries: FlatPageEntry[], lessonId: number): number {
  return entries.findIndex(fp => fp.lesson.id === lessonId);
}

/** Resolves a stable (pageId, blockIdx) anchor to wherever it currently
 *  lives in THIS device's computed pagination. */
function findFlatIndexForAnchor(entries: FlatPageEntry[], lessonId: number, anchor: ProgressAnchor): number {
  if (anchor.blockIdx === -1) {
    return entries.findIndex(fp => fp.lesson.id === lessonId && fp.content.kind === 'cover');
  }
  return entries.findIndex(fp =>
    fp.lesson.id === lessonId &&
    fp.content.kind === 'content' &&
    fp.content.items.some(it => it.originPageId === anchor.pageId && it.originBlockIdx === anchor.blockIdx)
  );
}

function anchorForEntry(entry: FlatPageEntry): ProgressAnchor {
  if (entry.content.kind === 'cover') {
    const coverId = entry.lesson.pages?.find(p => p.type === 'cover')?.id ?? 0;
    return { pageId: coverId, blockIdx: -1 };
  }
  const first = entry.content.items[0];
  return first
    ? { pageId: first.originPageId, blockIdx: first.originBlockIdx }
    : { pageId: 0, blockIdx: -1 };
}

// ─── Cross-paragraph selection ────────────────────────────────────────────────
// A selection may span several paragraphs. Since each paragraph is its own
// block element with its own character offsets, a multi-paragraph selection
// is sliced into one range per block here, and later saved as one highlight
// record per block sharing a groupId (see lib/highlights.ts) — which keeps
// per-block rendering untouched.

/** Every highlightable block on the page `el` belongs to, in reading order. */
function blocksOnPageOf(el: Element): Element[] {
  const pageEl = findAncestorWithAttr(el, 'data-page-idx');
  if (!pageEl) return [el];
  return Array.from(pageEl.querySelectorAll('[data-block-idx]'));
}

const blockTextLength = (el: Element) => (el.textContent ?? '').length;

/** Slices a drag from an anchor point to a focus point into one range per
 *  paragraph it covers, in reading order (handles dragging either way). */
function buildSelectionParts(
  anchorBlock: Element, anchorOffset: number,
  focusBlock:  Element, focusOffset:  number,
): LiveSelectionPart[] {
  if (anchorBlock === focusBlock) {
    const start = Math.min(anchorOffset, focusOffset);
    const end   = Math.max(anchorOffset, focusOffset);
    return start === end ? [] : [{ block: anchorBlock, start, end }];
  }

  const all = blocksOnPageOf(anchorBlock);
  const ia  = all.indexOf(anchorBlock);
  const ib  = all.indexOf(focusBlock);
  // Different pages can't be part of one drag; fall back to the anchor only.
  if (ia < 0 || ib < 0) {
    return [{ block: anchorBlock, start: anchorOffset, end: blockTextLength(anchorBlock) }];
  }

  const forward    = ia < ib;
  const first      = forward ? anchorBlock  : focusBlock;
  const firstStart = forward ? anchorOffset : focusOffset;
  const last       = forward ? focusBlock   : anchorBlock;
  const lastEnd    = forward ? focusOffset  : anchorOffset;

  return all
    .slice(Math.min(ia, ib), Math.max(ia, ib) + 1)
    .map(block => ({
      block,
      start: block === first ? firstStart : 0,
      end:   block === last  ? lastEnd    : blockTextLength(block),
    }))
    .filter(p => p.start < p.end);
}

/** Resolves live DOM ranges into persistable, block-addressed parts. */
function toSelectionParts(live: LiveSelectionPart[]): SelectionPart[] {
  const out: SelectionPart[] = [];
  for (const { block, start, end } of live) {
    const blockIdx = parseInt(block.getAttribute('data-block-idx') ?? '-1', 10);
    const pageId   = parseInt(block.getAttribute('data-origin-page-id') ?? '-1', 10);
    const pageEl   = findAncestorWithAttr(block, 'data-page-idx');
    const pageIdx  = parseInt(pageEl?.getAttribute('data-page-idx') ?? '-1', 10);
    const lessonId = parseInt(pageEl?.getAttribute('data-lesson-id') ?? '-1', 10);
    if (blockIdx < 0 || pageId < 0 || pageIdx < 0 || lessonId < 0) continue;
    const text = (block.textContent ?? '').slice(start, end);
    if (!text.trim()) continue;
    out.push({ lessonId, pageId, pageIdx, blockIdx, startOffset: start, endOffset: end, text });
  }
  return out;
}

// ─── Types ────────────────────────────────────────────────────────────────────

/** One paragraph's slice of a selection, addressed for persistence. */
interface SelectionPart {
  lessonId:    number;
  pageId:      number; // original authored page this block lives on
  pageIdx:     number; // local to lessonId, current device's pagination
  blockIdx:    number;
  startOffset: number;
  endOffset:   number;
  text:        string;
}

interface PendingSelection {
  /** One entry per paragraph covered — always at least one. */
  parts:   SelectionPart[];
  /** The whole selection as continuous text (note editor preview, storage). */
  text:    string;
  anchorY: number;
}

interface BookReaderProps {
  /** Which lesson to open the book at (resumes mid-lesson if that lesson has
   *  saved progress). Reading onward from here crosses lesson boundaries
   *  entirely inside this component. */
  initialLessonId: number;
  /** Reached the very last page of the very last lesson and tried to go
   *  further — there's nothing left in the book. */
  onFinishBook: () => void;
  onBack:       () => void;
  /** Fired whenever the page the reader is showing belongs to a different
   *  lesson than before — lets the host keep the URL's lesson id in sync as
   *  the reader crosses lesson boundaries internally, so a hard reload
   *  reopens wherever the reader actually is, not wherever the book was
   *  first opened from. */
  onLessonChange?: (lessonId: number) => void;
  /** "Ver destaques" was tapped — the reader has no highlights UI of its own
   *  anymore (it's the full standalone /jornada/destaques page now), so this
   *  just tells the host to navigate there. */
  onOpenHighlights?: (currentLessonId: number) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BookReader({ initialLessonId, onFinishBook, onBack, onLessonChange, onOpenHighlights }: BookReaderProps) {
  const containerRef   = useRef<HTMLDivElement>(null);
  const carouselRef    = useRef<HTMLDivElement>(null);
  const pageWidthRef   = useRef(0);
  const pageHeightRef  = useRef(0);
  const dragOffsetRef  = useRef(0);
  const touchStartX    = useRef(0);
  const touchStartPage = useRef(0);
  const wheelLock      = useRef(false);
  const progressTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Dynamic pagination ─────────────────────────────────────────────────────
  // Recomputed only when the container's WIDTH actually changes (true resize/
  // orientation change) — never on a height-only wiggle (iOS animating its
  // address bar in/out), which would otherwise repaginate mid-read for no
  // real reason. `measureTrigger` snapshots the height alongside width at the
  // moment width changes, so the measurer still sees an accurate height.
  const [measureTrigger, setMeasureTrigger] = useState<{ width: number; height: number } | null>(null);
  const [pagesByLesson, setPagesByLesson] = useState<Map<number, DynamicPage[]> | null>(null);
  // Body copy renders in Inter/Playfair Display, loaded async over the
  // network (see index.css). Measuring before they've actually loaded would
  // pack pages using the fallback system font's metrics — usually narrower
  // or shorter than the real webfont — so text that fit during measurement
  // can still overflow once the real font swaps in. Gate pagination on it.
  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    if (typeof document === 'undefined' || !('fonts' in document)) { setFontsReady(true); return; }
    let cancelled = false;
    const markReady = () => { if (!cancelled) setFontsReady(true); };
    Promise.all([
      document.fonts.load(`300 ${19}px Inter`),
      document.fonts.load(`400 ${19}px "Playfair Display"`),
    ]).catch(() => {}).finally(markReady);
    document.fonts.ready.then(markReady).catch(markReady);
    return () => { cancelled = true; };
  }, []);

  // ── Core reader state ──────────────────────────────────────────────────────
  // A single global index into flatPages — the only position the reader
  // tracks. Starts at 0 and jumps to the real starting page (resolved from
  // saved progress) in a layout effect once pagination is ready — see the
  // "initial position" effect below.
  const [currentPage, setCurrentPage] = useState(0);
  const didInitRef = useRef(false);
  // Mirrors currentPage on every render so the unmount-flush effect below
  // can always read the latest page. A ref, not the state variable itself,
  // is required there: an effect with an empty dep array only closes over
  // the value currentPage had at mount, so reading it directly in that
  // effect's cleanup would flush whatever page the reader opened on — not
  // wherever the user actually was when they left.
  const currentPageRef = useRef(currentPage);
  currentPageRef.current = currentPage;
  const [dragOffset,  setDragOffset]  = useState(0);
  const [isDragging,  setIsDragging]  = useState(false);
  const [pageWidth,   setPageWidth]   = useState(0);
  const [isCarousel,  setIsCarousel]  = useState(false);

  // ── UI / mode state ────────────────────────────────────────────────────────
  const [readerMode,        setReaderMode]        = useState<ReaderMode>('reading');
  // Which highlight tool is active while readerMode === 'highlighting'.
  // 'brush' is the original select-then-confirm flow; 'eraser' deletes any
  // highlight you tap on. Always resets to 'brush' when entering the mode.
  const [highlightTool,     setHighlightTool]     = useState<HighlightTool>('brush');
  const [showExitConfirm,   setShowExitConfirm]   = useState(false);
  const [pendingSelection,  setPendingSelection]  = useState<PendingSelection | null>(null);
  const [noteEditorOpen,    setNoteEditorOpen]    = useState(false);
  const [highlightHint,     setHighlightHint]     = useState(false);
  const [pulsingHighlightId, setPulsingHighlightId] = useState<string | null>(null);

  // ── Touch drag-to-select (mobile) ──────────────────────────────────────────
  // Live ranges being dragged out, painted by <TouchSelectionOverlay>. One
  // entry per paragraph the drag covers. Mirrored into a ref so finishDrag
  // can read the final value without a stale closure (and without doing
  // side effects inside a state updater, which double-fires in StrictMode).
  const [liveSelection, setLiveSelection] = useState<LiveSelectionPart[] | null>(null);
  const liveSelectionRef = useRef<LiveSelectionPart[] | null>(null);
  const setLive = useCallback((parts: LiveSelectionPart[] | null) => {
    liveSelectionRef.current = parts;
    setLiveSelection(parts);
  }, []);
  const touchAnchorRef = useRef<{ block: Element; offset: number } | null>(null);

  // Set when the gesture that is about to produce a `click` already did
  // something meaningful — erased a highlight, or completed a selection.
  // handleAreaClick reads and clears it: an inert tap in highlight mode
  // dismisses the tools, an productive one must not.
  const tapDidActionRef = useRef(false);

  // ── Highlights data ────────────────────────────────────────────────────────
  const [allHighlights, setAllHighlights] = useState<BookHighlight[]>(() => loadAllHighlights());

  // ── Copy-protection (always active — copy/cut/Ctrl+C stay blocked) ─────────
  useReaderContentProtection(containerRef);

  // ── Measure container ──────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      pageHeightRef.current = height;
      // Only trigger a re-render (and a repagination pass) when width
      // actually changes — see the comment on measureTrigger above.
      setPageWidth(prev => {
        if (prev === width) return prev;
        pageWidthRef.current = width;
        setMeasureTrigger({ width, height });
        return width;
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Flatten this device's computed pagination into one book-wide list ─────
  const flatPages = useMemo<FlatPageEntry[]>(() => {
    if (!pagesByLesson) return [];
    const out: FlatPageEntry[] = [];
    for (const lesson of lessons) {
      if (lesson.status === 'upcoming') continue;
      const pages = pagesByLesson.get(lesson.id);
      if (!pages) continue;
      pages.forEach((content, localIndex) => out.push({ lesson, content, localIndex }));
    }
    return out;
  }, [pagesByLesson]);

  const bookTotalPages = flatPages.length;

  // ── Jump to the real starting page once pagination is ready ───────────────
  useLayoutEffect(() => {
    if (didInitRef.current) return;
    if (flatPages.length === 0) return;
    didInitRef.current = true;
    const startIdx = findLessonStart(flatPages, initialLessonId);
    if (startIdx < 0) return;

    // A tap on a highlight from the standalone /jornada/destaques page takes
    // priority over resuming normal reading progress — the user explicitly
    // asked to jump there.
    const pendingJump = consumePendingHighlightJump();
    if (pendingJump && pendingJump.lessonId === initialLessonId) {
      // Primary: exact block search (stable across devices/pagination changes)
      let jumpIdx = findFlatIndexForAnchor(flatPages, initialLessonId, pendingJump);

      // Fallback: lesson-local pageIndex stored at highlight creation time.
      // Works correctly when the exact block is not found (e.g. pagination
      // changed, or the block coordinates were corrupted). Not reliable across
      // different screen sizes but usually correct on the same device.
      if (jumpIdx < 0 && pendingJump.pageIndex !== undefined) {
        const candidateIdx = startIdx + pendingJump.pageIndex;
        if (candidateIdx >= startIdx && candidateIdx < flatPages.length &&
            flatPages[candidateIdx]?.lesson.id === initialLessonId) {
          jumpIdx = candidateIdx;
        }
      }

      if (jumpIdx >= 0) {
        setCurrentPage(jumpIdx);
        setTimeout(() => {
          setPulsingHighlightId(pendingJump.highlightId);
          setTimeout(() => setPulsingHighlightId(null), 1400);
        }, 350);
        return;
      }
    }

    const anchor = loadProgress(initialLessonId);
    const resolved = anchor ? findFlatIndexForAnchor(flatPages, initialLessonId, anchor) : -1;
    setCurrentPage(resolved >= 0 ? resolved : startIdx);
  }, [flatPages, initialLessonId]);

  // ── Auto-save progress whenever current page changes ──────────────────────
  // Anchored to the page's first block's ORIGINAL (pageId, blockIdx), not its
  // position — a device-specific position would resume in the wrong place on
  // a different screen size. See anchorForEntry / findFlatIndexForAnchor.
  useEffect(() => {
    const entry = flatPages[currentPage];
    if (!entry) return;
    if (progressTimer.current) clearTimeout(progressTimer.current);
    progressTimer.current = setTimeout(() => {
      saveProgress(entry.lesson.id, anchorForEntry(entry));
    }, 300);
    return () => { if (progressTimer.current) clearTimeout(progressTimer.current); };
  }, [currentPage, flatPages]);

  // ── Flush progress on unmount ──────────────────────────────────────────────
  // Covers leaving via back-navigation/route change, not just the explicit
  // "Sair" button (which already flushes immediately in handleExit). Reads
  // currentPageRef/flatPagesRef, not the state values directly, so this
  // always saves whatever the reader was actually showing when it
  // unmounted — an effect with an empty dep array only closes over the
  // values its state had at mount otherwise.
  const flatPagesRef = useRef(flatPages);
  flatPagesRef.current = flatPages;
  useEffect(() => {
    return () => {
      const entry = flatPagesRef.current[currentPageRef.current];
      if (entry) saveProgress(entry.lesson.id, anchorForEntry(entry));
      flushPendingProgress(); // navegação para fora do leitor → flush imediato
    };
  }, []);

  // ── Text selection capture — desktop mouse only ────────────────────────────
  // Touch devices use the custom drag-to-select effect below instead: iOS
  // Safari's own long-press-to-select gesture (haptic + loupe) has proven
  // unreliable in this app — any React re-render landing while that native
  // gesture is mid-flight makes WebKit lose its anchor and snap the
  // selection to the entire block. Native window.getSelection()/Range only
  // ever gets engaged here for mouse input now (see IS_TOUCH_DEVICE guard
  // and userSelect in BookPage's HighlightableText, which never opens up
  // native selection on a touch device in the first place).
  useEffect(() => {
    if (readerMode !== 'highlighting') return;
    if (highlightTool !== 'brush') return; // eraser taps, never selects
    if (IS_TOUCH_DEVICE) return;

    // ── pendingFromRange: extract PendingSelection from a Range ──────────────
    // Handles selections spanning several paragraphs, sliced into one range
    // per block exactly like the touch path.
    const pendingFromRange = (range: Range): PendingSelection | null => {
      if (!range.toString().trim()) return null;

      const anchorBlock = findAncestorWithAttr(range.startContainer, 'data-block-idx');
      const focusBlock  = findAncestorWithAttr(range.endContainer,   'data-block-idx');
      const firstBlock  = anchorBlock ?? focusBlock;
      const lastBlock   = focusBlock  ?? anchorBlock;
      if (!firstBlock || !lastBlock) return null;

      const startOffset = anchorBlock
        ? getOffsetInBlock(range.startContainer, range.startOffset, firstBlock)
        : 0;
      const endOffset = focusBlock
        ? getOffsetInBlock(range.endContainer, range.endOffset, lastBlock)
        : blockTextLength(lastBlock);
      if (startOffset < 0 || endOffset < 0) return null;

      const live = buildSelectionParts(firstBlock, startOffset, lastBlock, endOffset);
      const parts = toSelectionParts(live);
      if (parts.length === 0) return null;

      const rect = range.getBoundingClientRect();
      return {
        parts,
        text:    parts.map(p => p.text).join(' ').replace(/\s+/g, ' ').trim(),
        anchorY: rect.top + rect.height / 2,
      };
    };

    // ── Text selection → show confirm menu ───────────────────────────────────
    // Strategy: capture the Range synchronously on every non-collapsed
    // selectionchange. A short debounce lets handles settle before showing
    // the menu. We also listen to mouseup for reliability.
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let latestRange:   Range | null = null;

    const commit = () => {
      debounceTimer = null;
      if (!latestRange) return;
      const r = latestRange;
      latestRange = null;
      const pending = pendingFromRange(r);
      if (pending) setPendingSelection(pending);
    };

    const scheduleCommit = (delay: number) => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(commit, delay);
    };

    const onSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
      latestRange = sel.getRangeAt(0).cloneRange();
      scheduleCommit(280);
    };

    const onMouseUp = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
      latestRange = sel.getRangeAt(0).cloneRange();
      scheduleCommit(80);
    };

    document.addEventListener('selectionchange', onSelectionChange);
    document.addEventListener('mouseup',         onMouseUp);

    return () => {
      document.removeEventListener('selectionchange', onSelectionChange);
      document.removeEventListener('mouseup',         onMouseUp);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [readerMode, highlightTool]);

  // ── Text selection capture — touch drag (mobile) ───────────────────────────
  // Never touches window.getSelection(): we resolve each touch point to a
  // character offset ourselves via document.caretRangeFromPoint, track the
  // drag with plain refs/state, and paint our own overlay
  // (<TouchSelectionOverlay>). Since no native Selection is ever created,
  // there is nothing for WebKit's own gesture recognizer to engage or lose
  // track of — re-rendering mid-drag is completely safe here.
  useEffect(() => {
    if (readerMode !== 'highlighting') return;
    if (highlightTool !== 'brush') return; // eraser taps, never selects
    if (!IS_TOUCH_DEVICE) return;
    const container = containerRef.current;
    if (!container) return;

    let rafId: number | null = null;
    let pendingPoint: { x: number; y: number } | null = null;

    const resolvePoint = (x: number, y: number) => {
      // elementsFromPoint (unlike its singular elementFromPoint) returns the
      // whole stack at that point, topmost first, respecting pointer-events
      // correctly. We need the whole stack — not just the top hit — because
      // a real interactive overlay can legitimately sit on top of the text:
      // HighlightSelectionMenu's dismiss-tap backdrop covers the full page
      // while a previous selection is still pending confirmation. Starting a
      // new drag there should reach the text underneath and replace the
      // pending selection, not be blocked by the backdrop.
      const stack = document.elementsFromPoint(x, y);
      let block: Element | null = null;
      for (const el of stack) {
        block = findAncestorWithAttr(el, 'data-block-idx');
        if (block) break;
      }
      if (!block) return null;
      const offset = offsetAtPoint(block, x, y);
      return { block, offset };
    };

    const flush = () => {
      rafId = null;
      const anchor = touchAnchorRef.current;
      if (!pendingPoint || !anchor) return;
      const { x, y } = pendingPoint;

      // Resolve the point under the finger. A selection may cross into other
      // paragraphs, so a different block here is a legitimate extension of
      // the drag, not something to clamp away. When the finger is between
      // blocks (padding/margins) resolvePoint finds nothing — fall back to
      // the nearest block edge by direction so the selection still grows.
      const current = resolvePoint(x, y) ?? (() => {
        const rect = anchor.block.getBoundingClientRect();
        return {
          block:  anchor.block,
          offset: y < rect.top ? 0 : blockTextLength(anchor.block),
        };
      })();

      const parts = buildSelectionParts(anchor.block, anchor.offset, current.block, current.offset);
      setLive(parts.length > 0 ? parts : null);
    };

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      const point = resolvePoint(t.clientX, t.clientY);
      if (!point) {
        touchAnchorRef.current = null;
        return;
      }
      // Only now do we know this touch started on highlightable text —
      // prevent default so iOS never engages its own long-press gesture.
      e.preventDefault();
      touchAnchorRef.current = { block: point.block, offset: point.offset };
      setLive(null);
      // Deliberately do NOT clear pendingSelection here. Doing so would
      // unmount HighlightSelectionMenu's full-screen dismiss backdrop —
      // which, if this touch physically landed on that backdrop (the usual
      // case when starting a new drag over an already-pending selection),
      // is the very element the browser is tracking this touch against.
      // Removing it mid-touch makes the browser cancel the gesture, so only
      // a second, separate touch (with no backdrop in the way) would ever
      // work. The old pending selection is naturally replaced — not
      // cleared-then-set — once this drag actually finishes (finishDrag).
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!touchAnchorRef.current) return;
      e.preventDefault();
      const t = e.touches[0];
      pendingPoint = { x: t.clientX, y: t.clientY };
      if (rafId == null) rafId = requestAnimationFrame(flush);
    };

    const finishDrag = () => {
      // If a RAF update is still pending, flush it synchronously now so the
      // very last touch position is always committed before we read the result.
      // Without this, touchend arriving before the queued RAF executes would
      // cancel the update, leaving liveSelectionRef stale/null and causing the
      // selection to disappear instead of showing the save menu.
      if (rafId != null) {
        cancelAnimationFrame(rafId);
        rafId = null;
        flush(); // touchAnchorRef is still valid here; pendingPoint has the final pos
      }
      const anchor = touchAnchorRef.current;
      touchAnchorRef.current = null;
      if (!anchor) return;

      const live = liveSelectionRef.current;
      if (!live || live.length === 0) return;

      const parts = toSelectionParts(live);
      if (parts.length === 0) { setLive(null); return; }

      tapDidActionRef.current = true; // the trailing click must not dismiss
      setPendingSelection({
        parts,
        text:    parts.map(p => p.text).join(' ').replace(/\s+/g, ' ').trim(),
        anchorY: live[0].block.getBoundingClientRect().top,
      });
      // Overlay keeps painting underneath the confirm menu.
    };

    container.addEventListener('touchstart',  onTouchStart, { passive: false });
    container.addEventListener('touchmove',   onTouchMove,  { passive: false });
    container.addEventListener('touchend',    finishDrag,   { passive: false });
    container.addEventListener('touchcancel', finishDrag,   { passive: false });

    return () => {
      container.removeEventListener('touchstart',  onTouchStart);
      container.removeEventListener('touchmove',   onTouchMove);
      container.removeEventListener('touchend',    finishDrag);
      container.removeEventListener('touchcancel', finishDrag);
      if (rafId != null) cancelAnimationFrame(rafId);
    };
  }, [readerMode, highlightTool]);

  // ── Eraser: tap any word inside a highlight to delete it ───────────────────
  // The rendered <mark> carries data-highlight-ids (see HighlightedText), so
  // a tap resolves straight to the ids under the finger. elementsFromPoint,
  // not the click target, because the same overlay-stacking caveat as the
  // brush applies — the topmost hit may be a transparent layer.
  useEffect(() => {
    if (readerMode !== 'highlighting') return;
    if (highlightTool !== 'eraser') return;
    const container = containerRef.current;
    if (!container) return;

    const eraseAt = (x: number, y: number) => {
      const markEl = document
        .elementsFromPoint(x, y)
        .map(el => findAncestorWithAttr(el, 'data-highlight-ids'))
        .find(Boolean);
      if (!markEl) return;
      const ids = (markEl.getAttribute('data-highlight-ids') ?? '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      if (ids.length === 0) return;
      // Erase whole logical highlights, never one paragraph of a
      // multi-paragraph selection.
      setAllHighlights(prev => {
        const keys = new Set(prev.filter(h => ids.includes(h.id)).map(groupKey));
        if (keys.size === 0) return prev;
        keys.forEach(removeHighlightGroup);
        return prev.filter(h => !keys.has(groupKey(h)));
      });
      // This tap erased something, so the trailing click must not be read
      // as "tapped empty space" and close the tool bar.
      tapDidActionRef.current = true;
    };

    const onPointerUp = (e: PointerEvent) => eraseAt(e.clientX, e.clientY);
    const onTouchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      if (t) eraseAt(t.clientX, t.clientY);
    };

    // Touch devices get the touch listener only — pointerup would double-fire
    // alongside it and try to erase twice at the same point.
    if (IS_TOUCH_DEVICE) container.addEventListener('touchend', onTouchEnd);
    else                 container.addEventListener('pointerup', onPointerUp);

    return () => {
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('pointerup', onPointerUp);
    };
  }, [readerMode, highlightTool]);

  // ── Escape key: cancel highlight mode ──────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (noteEditorOpen) return; // let NoteEditor handle it
      if (pendingSelection) { clearSelection(); return; }
      if (readerMode === 'highlighting') { exitHighlightMode(); return; }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [readerMode, pendingSelection, noteEditorOpen]);

  // ── Hint toast for highlight mode ─────────────────────────────────────────
  // Re-shows on tool switch too, since the instruction differs per tool.
  useEffect(() => {
    if (readerMode !== 'highlighting') { setHighlightHint(false); return; }
    setHighlightHint(true);
    const t = setTimeout(() => setHighlightHint(false), 2200);
    return () => clearTimeout(t);
  }, [readerMode, highlightTool]);

  // ── Navigate ───────────────────────────────────────────────────────────────
  const goTo = useCallback((page: number) => {
    const clamped = Math.max(0, Math.min(page, bookTotalPages - 1));
    dragOffsetRef.current = 0;
    setDragOffset(0);
    setIsDragging(false);
    setIsCarousel(false);
    setCurrentPage(clamped);
    // Exit highlight mode on navigation (but keep reading mode intact)
    if (readerMode === 'highlighting') exitHighlightMode();
  }, [bookTotalPages, readerMode]);

  // ── Highlight mode helpers ─────────────────────────────────────────────────
  const exitHighlightMode = () => {
    setReaderMode('reading');
    setHighlightTool('brush'); // next entry always starts on the brush
    setPendingSelection(null);
    setLive(null);
    window.getSelection()?.removeAllRanges();
  };

  const clearSelection = () => {
    setPendingSelection(null);
    setLive(null);
    window.getSelection()?.removeAllRanges();
  };

  // ── Touch: one page per gesture (disabled in highlight mode) ──────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (readerMode === 'highlighting') return;
    touchStartX.current    = e.touches[0].clientX;
    touchStartPage.current = currentPage;
    setIsDragging(true);
  }, [currentPage, readerMode]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (readerMode === 'highlighting') return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const pw = pageWidthRef.current;
    let clamped = Math.max(-pw, Math.min(pw, dx));
    if (touchStartPage.current === 0)                  clamped = Math.min(0, clamped);
    if (touchStartPage.current >= bookTotalPages - 1)  clamped = Math.max(0, clamped);
    dragOffsetRef.current = clamped;
    setDragOffset(clamped);
  }, [bookTotalPages, readerMode]);

  const handleTouchEnd = useCallback(() => {
    if (readerMode === 'highlighting') return;
    const pw        = pageWidthRef.current;
    const threshold = pw * 0.25;
    const offset    = dragOffsetRef.current;
    if (offset < -threshold) {
      // Swiped forward past the last page of the whole book — nothing left.
      if (touchStartPage.current >= bookTotalPages - 1) onFinishBook();
      else goTo(touchStartPage.current + 1);
    }
    else if (offset > threshold)  goTo(touchStartPage.current - 1);
    else                          goTo(touchStartPage.current);
  }, [goTo, readerMode, bookTotalPages, onFinishBook]);

  // ── Desktop wheel ──────────────────────────────────────────────────────────
  const handleWheel = useCallback((e: WheelEvent) => {
    if (isCarousel) return;
    if (readerMode === 'highlighting') return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault();
    if (wheelLock.current) return;
    wheelLock.current = true;
    const dir = e.deltaY > 0 ? 1 : -1;
    if (dir > 0 && currentPage >= bookTotalPages - 1) {
      onFinishBook();
    } else {
      setCurrentPage(prev => Math.max(0, Math.min(prev + dir, bookTotalPages - 1)));
    }
    setTimeout(() => { wheelLock.current = false; }, 550);
  }, [bookTotalPages, isCarousel, readerMode, currentPage, onFinishBook]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // ── Scroll carousel to current page when it opens ─────────────────────────
  useEffect(() => {
    if (!isCarousel) return;
    const el = carouselRef.current;
    if (!el) return;
    const thumbW = pageWidthRef.current * 0.58 + 12;
    const offset = currentPage * thumbW - pageWidthRef.current / 2 + thumbW / 2;
    el.scrollLeft = Math.max(0, offset);
  }, [isCarousel]);

  const currentEntry  = flatPages[currentPage];
  const currentLesson = currentEntry?.lesson;
  const translateX = -(currentPage * pageWidth) + dragOffset;

  // ── Keep the URL's lesson id in sync as lessons are crossed internally ────
  useEffect(() => {
    if (currentLesson) onLessonChange?.(currentLesson.id);
  }, [currentLesson?.id, onLessonChange]);

  // ── Click zones: left third | centre third | right third ──────────────────
  const handleAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!currentEntry) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, textarea, select')) return;

    // In highlight mode taps never navigate. An *inert* tap — one that
    // neither erased a highlight nor completed a selection — means "I'm
    // done", so it dismisses the tool bar and returns to reading. A
    // productive tap leaves the mode alone (tapDidActionRef), and while a
    // selection is pending the confirm menu owns dismissal.
    if (readerMode === 'highlighting') {
      const didAction = tapDidActionRef.current;
      tapDidActionRef.current = false;
      if (!didAction && !pendingSelection) exitHighlightMode();
      return;
    }

    const { left, width } = e.currentTarget.getBoundingClientRect();
    const x     = e.clientX - left;
    const third = width / 3;
    if (x < third) {
      // Only the very first page of the very first lesson exits the book —
      // any other lesson's opening page just steps back into the previous
      // lesson's last page, same as turning back any other page.
      currentPage === 0 ? setShowExitConfirm(true) : goTo(currentPage - 1);
    } else if (x > third * 2) {
      // Tapped forward past the last page of the whole book — nothing left.
      if (currentPage >= bookTotalPages - 1) onFinishBook();
      else goTo(currentPage + 1);
    } else {
      setIsCarousel(true);
    }
  };

  // ── Toolbar handlers ───────────────────────────────────────────────────────
  const handleExit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentEntry) saveProgress(currentEntry.lesson.id, anchorForEntry(currentEntry));
    flushPendingProgress(); // sair do leitor grava no Firestore sem esperar o debounce
    onBack();
  };
  const handleHighlightToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (readerMode === 'highlighting') {
      exitHighlightMode();
    } else {
      setHighlightTool('brush');
      setReaderMode('highlighting');
    }
  };
  const handleViewHighlights = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentLesson) onOpenHighlights?.(currentLesson.id);
  };

  // ── Selection menu handlers ────────────────────────────────────────────────
  // One record per paragraph covered, all sharing a groupId so they read and
  // delete as a single highlight. `selectedText` on each record is that
  // paragraph's own slice; the full text is kept on the first record's note
  // context via PendingSelection.text where needed.
  const buildRecords = (note?: string): BookHighlight[] => {
    if (!pendingSelection) return [];
    const gid = crypto.randomUUID();
    const now = new Date().toISOString();
    return pendingSelection.parts.map(part => ({
      id:           crypto.randomUUID(),
      groupId:      gid,
      lessonId:     part.lessonId,
      pageId:       part.pageId,
      pageIndex:    part.pageIdx,
      blockIdx:     part.blockIdx,
      startOffset:  part.startOffset,
      endOffset:    part.endOffset,
      selectedText: part.text,
      note:         note || undefined,
      createdAt:    now,
    }));
  };

  const commitHighlight = (note?: string) => {
    const records = buildRecords(note);
    if (records.length === 0) return;
    addHighlights(records);
    // Optimistic update: append directly to state so the marks render
    // immediately without depending on a localStorage round-trip.
    setAllHighlights(prev => [...prev, ...records]);
    clearSelection();
    exitHighlightMode();
  };

  const handleSaveHighlight = () => commitHighlight();

  const handleOpenNoteEditor = () => {
    if (!pendingSelection) return;
    setNoteEditorOpen(true);
  };

  const handleSaveNote = (note: string) => {
    setNoteEditorOpen(false);
    commitHighlight(note);
  };

  const handleCancelSelection = () => {
    clearSelection();
    // Keep highlight mode active (user may want to try again)
  };

  // ── Thumbnail dimensions ───────────────────────────────────────────────────
  const thumbW     = pageWidth * 0.58;
  const thumbH     = pageHeightRef.current * 0.58;
  const thumbScale = 0.58;

  return (
    <div
      ref={containerRef}
      className="book-reader-root"
      style={{
        flex: 1, position: 'relative', overflow: 'hidden',
        background: '#050505', cursor: 'pointer',
        // 'none' during highlighting: touch-action is resolved by the
        // browser's compositor before any JS runs, independently of
        // preventDefault() in our touch handlers. With 'auto' left in place,
        // the compositor pre-commits a vertical drag to native scroll/bounce
        // regardless of what our touchmove listener does — 'none' is what
        // actually hands the whole gesture to our drag-to-select JS.
        touchAction: readerMode === 'highlighting' ? 'none' : 'auto',
      }}
      // Capture phase, always on: every new gesture starts with a clean
      // "did this tap do anything?" flag. Without this reset a drag that
      // never emits a trailing click (browsers suppress click after a
      // drag) would leave the flag set and swallow the NEXT tap's dismiss.
      onPointerDownCapture={() => { tapDidActionRef.current = false; }}
      onTouchStart={(!isCarousel && readerMode !== 'highlighting') ? handleTouchStart : undefined}
      onTouchMove={(!isCarousel && readerMode !== 'highlighting') ? handleTouchMove : undefined}
      onTouchEnd={(!isCarousel && readerMode !== 'highlighting') ? handleTouchEnd : undefined}
      onClick={!isCarousel ? handleAreaClick : undefined}
    >
      {/* ── Hidden measurer — paginates every lesson for this device's real
          rendered dimensions. Waits for the real webfonts to finish loading
          first (see fontsReady above), so pagination is never computed off
          fallback-font metrics. ── */}
      {measureTrigger && fontsReady && (
        <BookMeasurer
          lessons={lessons}
          containerWidth={measureTrigger.width}
          containerHeight={measureTrigger.height}
          onMeasured={setPagesByLesson}
        />
      )}

      {/* ── Page strip — every page of every lesson, one continuous book ─────── */}
      {currentEntry && (
        <div
          style={{
            display:    'flex',
            width:      `${bookTotalPages * 100}%`,
            height:     '100%',
            transform:  `translateX(${translateX}px)`,
            transition: isDragging ? 'none' : 'transform 0.32s cubic-bezier(0.25,0.1,0.25,1)',
            willChange: 'transform',
          }}
        >
          {flatPages.map((entry, idx) => (
            <div
              key={`${entry.lesson.id}-${entry.localIndex}`}
              data-page-idx={entry.localIndex}
              data-lesson-id={entry.lesson.id}
              style={{ width: `${100 / bookTotalPages}%`, height: '100%', flexShrink: 0 }}
            >
              <BookPage
                lesson={entry.lesson}
                content={entry.content}
                displayIndex={idx}
                isPortrait={true}
                watermarkIdentity={mockWatermarkIdentity}
                isHighlightMode={readerMode === 'highlighting'}
                allHighlights={allHighlights}
                pulsingHighlightId={pulsingHighlightId}
              />
            </div>
          ))}
        </div>
      )}

      {/* ── Toolbar — always expanded, always visible ────────────────────────── */}
      {!isCarousel && currentEntry && (
        <ReaderToolbar
          mode={readerMode}
          onExit={handleExit}
          onHighlight={handleHighlightToggle}
          onViewHighlights={handleViewHighlights}
        />
      )}

      {/* ── Highlight-mode instruction toast ────────────────────────────────── */}
      {highlightHint && (
        <div
          aria-live="polite"
          style={{
            position:   'absolute',
            top:        '14px',
            left:       '50%',
            transform:  'translateX(-50%)',
            zIndex:     30,
            background: 'rgba(8,6,11,0.88)',
            border:     '1px solid rgba(178,102,255,0.25)',
            borderRadius: 100,
            padding:    '7px 16px',
            fontSize:   11,
            fontWeight: 500,
            color:      'rgba(210,160,255,0.90)',
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            animation:  'toolbar-expand-centered 0.22s cubic-bezier(0.34,1.56,0.64,1) both',
            backdropFilter: 'blur(10px)',
          }}
        >
          {highlightTool === 'eraser'
            ? 'Toque em uma marcação para apagá-la'
            : IS_TOUCH_DEVICE
              ? 'Arraste o dedo sobre o texto para selecionar'
              : 'Selecione o trecho que deseja destacar'}
        </div>
      )}

      {/* ── Highlight tool picker (brush / eraser) ──────────────────────────── */}
      {/* Mutually exclusive with the selection menu below: once something is
          selected the picker gives way to confirm/note/cancel, and comes
          back as soon as that selection is dismissed. Both occupy the same
          slot above the reader toolbar, so they must never coexist. */}
      {readerMode === 'highlighting' && !isCarousel && !pendingSelection && (
        <HighlightToolPicker tool={highlightTool} onChange={setHighlightTool} />
      )}

      {/* ── Live touch-selection overlay (mobile drag-to-select) ─────────────── */}
      {liveSelection && liveSelection.length > 0 && (
        <TouchSelectionOverlay parts={liveSelection} />
      )}

      {/* ── Text selection menu ─────────────────────────────────────────────── */}
      {pendingSelection && !noteEditorOpen && (
        <HighlightSelectionMenu
          anchorY={pendingSelection.anchorY}
          onSave={handleSaveHighlight}
          onNote={handleOpenNoteEditor}
          onCancel={handleCancelSelection}
        />
      )}

      {/* ── Note editor ─────────────────────────────────────────────────────── */}
      {noteEditorOpen && pendingSelection && (
        <NoteEditor
          selectedText={pendingSelection.text}
          onSave={handleSaveNote}
          onCancel={() => setNoteEditorOpen(false)}
        />
      )}

      {/* ── Carousel overlay ────────────────────────────────────────────────── */}
      {isCarousel && (
        <div
          style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'rgba(5,5,5,0.96)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}
          onClick={() => setIsCarousel(false)}
        >
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.30)' }}>
            Páginas
          </span>
          <div
            ref={carouselRef}
            onClick={e => e.stopPropagation()}
            style={{ display: 'flex', gap: '12px', overflowX: 'auto', overflowY: 'hidden', scrollSnapType: 'x mandatory', padding: `0 ${(pageWidth - thumbW) / 2}px`, scrollbarWidth: 'none', width: '100%', alignItems: 'center' }}
            className="hide-scrollbar"
          >
            {flatPages.map((entry, idx) => {
              const isActive = idx === currentPage;
              return (
                <div
                  key={`${entry.lesson.id}-${entry.localIndex}`}
                  onClick={() => goTo(idx)}
                  style={{ flexShrink: 0, scrollSnapAlign: 'center', width: `${thumbW}px`, height: `${thumbH}px`, borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', border: isActive ? '2px solid rgba(139,53,255,0.8)' : '2px solid rgba(255,255,255,0.08)', outline: isActive ? '4px solid rgba(139,53,255,0.15)' : 'none', transform: isActive ? 'scale(1.04)' : 'scale(1)', transition: 'transform 0.2s, border-color 0.2s', position: 'relative' }}
                >
                  <div style={{ width: `${pageWidth}px`, height: `${pageHeightRef.current}px`, transform: `scale(${thumbScale})`, transformOrigin: 'top left', pointerEvents: 'none', userSelect: 'none' }}>
                    <BookPage
                      lesson={entry.lesson}
                      content={entry.content}
                      displayIndex={idx}
                      isPortrait={true}
                      watermarkIdentity={mockWatermarkIdentity}
                      allHighlights={allHighlights}
                      pulsingHighlightId={pulsingHighlightId}
                      showPageNumber={false}
                    />
                  </div>
                  <div style={{ position: 'absolute', bottom: '6px', right: '8px', fontSize: '9px', fontFamily: 'monospace', color: isActive ? 'rgba(139,53,255,0.9)' : 'rgba(40,20,8,0.45)', fontWeight: 600 }}>
                    {idx + 1}
                  </div>
                </div>
              );
            })}
          </div>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.20)', letterSpacing: '0.04em', cursor: 'pointer' }} onClick={() => setIsCarousel(false)}>
            toque fora para fechar
          </span>
        </div>
      )}

      {/* ── Exit confirmation (tapping "previous page" on the book's first page) */}
      {showExitConfirm && (
        <ExitConfirmDialog
          onConfirm={() => { setShowExitConfirm(false); onBack(); }}
          onCancel={() => setShowExitConfirm(false)}
        />
      )}
    </div>
  );
}
