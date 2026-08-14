import { useRef, useState, useEffect, useCallback } from 'react';
import { BookPage } from './BookPage';
import { ReaderToolbar, type ReaderMode } from './ReaderToolbar';
import { HighlightSelectionMenu } from './HighlightSelectionMenu';
import { HighlightsPanel } from './HighlightsPanel';
import { NoteEditor } from './NoteEditor';
import type { Chapter } from '@/mocks/data';
import {
  type BookHighlight,
  loadHighlightsForPage,
  addHighlight,
  loadAllHighlights,
} from '@/lib/highlights';
import { saveProgress, loadProgress } from '@/lib/readerProgress';
import { useReaderContentProtection } from '@/hooks/useReaderContentProtection';
import { mockWatermarkIdentity } from '@/lib/watermark';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PendingSelection {
  text:        string;
  blockIdx:    number;
  pageIdx:     number;
  pageId:      number;
  startOffset: number;
  endOffset:   number;
  anchorY:     number;
}

interface BookReaderProps {
  chapter:    Chapter;
  onComplete: () => void;
  onBack:     () => void;
}

// ─── DOM helpers ──────────────────────────────────────────────────────────────

function findAncestorWithAttr(node: Node, attr: string): Element | null {
  let cur: Node | null = node;
  while (cur) {
    if (cur instanceof Element && cur.hasAttribute(attr)) return cur;
    cur = cur.parentNode;
  }
  return null;
}

/**
 * Returns the character offset of (node, offset) measured from the start of
 * blockEl's text content. Works whether node is a Text node or an Element
 * (browsers sometimes return an Element + child-index as a range endpoint,
 * e.g. when the selection ends at a line boundary).
 */
function getOffsetInBlock(node: Node, offset: number, blockEl: Element): number {
  try {
    const pre = document.createRange();
    pre.selectNodeContents(blockEl);
    pre.setEnd(node, offset);
    return pre.toString().length;
  } catch {
    return -1;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BookReader({ chapter, onComplete, onBack }: BookReaderProps) {
  const containerRef   = useRef<HTMLDivElement>(null);
  const carouselRef    = useRef<HTMLDivElement>(null);
  const pageWidthRef   = useRef(0);
  const pageHeightRef  = useRef(0);
  const dragOffsetRef  = useRef(0);
  const touchStartX    = useRef(0);
  const touchStartPage = useRef(0);
  const wheelLock      = useRef(false);
  const progressTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pages      = chapter.pages ?? [];
  const totalPages = pages.length;

  // ── Core reader state ──────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(() =>
    Math.min(loadProgress(chapter.id), Math.max(0, totalPages - 1))
  );
  const [dragOffset,  setDragOffset]  = useState(0);
  const [isDragging,  setIsDragging]  = useState(false);
  const [pageWidth,   setPageWidth]   = useState(0);
  const [isCarousel,  setIsCarousel]  = useState(false);

  // ── UI / mode state ────────────────────────────────────────────────────────
  const [readerMode,        setReaderMode]        = useState<ReaderMode>('reading');
  const [toolbarExpanded,   setToolbarExpanded]   = useState(false);
  const [highlightsPanelOpen, setHighlightsPanelOpen] = useState(false);
  const [pendingSelection,  setPendingSelection]  = useState<PendingSelection | null>(null);
  const [noteEditorOpen,    setNoteEditorOpen]    = useState(false);
  const [highlightHint,     setHighlightHint]     = useState(false);
  const [pulsingHighlightId, setPulsingHighlightId] = useState<string | null>(null);

  // ── Highlights data ────────────────────────────────────────────────────────
  const [allHighlights, setAllHighlights] = useState<BookHighlight[]>(() => loadAllHighlights());

  const refreshHighlights = useCallback(() => {
    setAllHighlights(loadAllHighlights());
  }, []);

  // ── Copy-protection (always active — copy/cut/Ctrl+C stay blocked) ─────────
  useReaderContentProtection(containerRef);

  // ── Measure container ──────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      pageWidthRef.current  = width;
      pageHeightRef.current = height;
      setPageWidth(width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Auto-save progress whenever current page changes ──────────────────────
  useEffect(() => {
    if (progressTimer.current) clearTimeout(progressTimer.current);
    progressTimer.current = setTimeout(() => {
      saveProgress(chapter.id, currentPage);
    }, 300);
    return () => { if (progressTimer.current) clearTimeout(progressTimer.current); };
  }, [chapter.id, currentPage]);

  // ── Flush progress on unmount ──────────────────────────────────────────────
  useEffect(() => {
    return () => { saveProgress(chapter.id, currentPage); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Text selection capture (only in highlight mode) ────────────────────────
  useEffect(() => {
    if (readerMode !== 'highlighting') return;

    // ── processSelection: read window.getSelection() and show the menu ────────
    const processSelection = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) return;

      const range = sel.getRangeAt(0);
      const selectedText = sel.toString().trim();
      if (!selectedText) return;

      const anchorBlock = findAncestorWithAttr(range.startContainer, 'data-block-idx');
      const focusBlock  = findAncestorWithAttr(range.endContainer,   'data-block-idx');

      // Determine the single valid block — clamp if selection drifts into padding
      const block = anchorBlock ?? focusBlock;
      if (!block) return;
      if (anchorBlock && focusBlock && anchorBlock !== focusBlock) return;

      const pageEl = findAncestorWithAttr(block, 'data-page-idx');
      if (!pageEl) return;

      const blockIdx = parseInt(block.getAttribute('data-block-idx') ?? '-1', 10);
      const pageIdx  = parseInt(pageEl.getAttribute('data-page-idx') ?? '-1', 10);
      if (blockIdx < 0 || pageIdx < 0) return;

      const startOffset = anchorBlock
        ? getOffsetInBlock(range.startContainer, range.startOffset, block)
        : 0;
      const endOffset = focusBlock
        ? getOffsetInBlock(range.endContainer, range.endOffset, block)
        : (block.textContent?.length ?? 0);

      if (startOffset < 0 || endOffset < 0 || startOffset >= endOffset) return;

      const rect = range.getBoundingClientRect();
      setPendingSelection({
        text: selectedText,
        blockIdx,
        pageIdx,
        pageId:      pages[pageIdx]?.id ?? 0,
        startOffset,
        endOffset,
        anchorY: rect.top + rect.height / 2,
      });
    };

    // ── selectWordAtPoint: find the word under (x,y) without sel.modify ───────
    // sel.modify() is unreliable on many iOS versions — it silently fails and
    // leaves the selection collapsed. We find word boundaries ourselves using
    // a regex walk on the text node's content, which works on every browser.
    const selectWordAtPoint = (x: number, y: number): boolean => {
      let range: Range | null = null;
      if (typeof document.caretRangeFromPoint === 'function') {
        range = document.caretRangeFromPoint(x, y);
      } else if ('caretPositionFromPoint' in document) {
        const pos = (document as Document & {
          caretPositionFromPoint(x: number, y: number): { offsetNode: Node; offset: number } | null;
        }).caretPositionFromPoint(x, y);
        if (pos) {
          range = document.createRange();
          range.setStart(pos.offsetNode, pos.offset);
          range.collapse(true);
        }
      }
      if (!range) return false;

      const node = range.startContainer;
      const el: Element | null =
        node.nodeType === Node.ELEMENT_NODE
          ? (node as Element)
          : (node as Text).parentElement;
      if (!el || !findAncestorWithAttr(el, 'data-block-idx')) return false;

      if (node.nodeType === Node.TEXT_NODE) {
        const text   = node.textContent ?? '';
        const offset = range.startOffset;
        // Walk left/right to word boundaries (space, NBSP, punctuation edges)
        let wStart = offset;
        let wEnd   = offset;
        while (wStart > 0 && !/[\s\u00A0]/.test(text[wStart - 1])) wStart--;
        while (wEnd < text.length && !/[\s\u00A0]/.test(text[wEnd]))  wEnd++;
        if (wStart >= wEnd) return false; // tapped on whitespace
        range.setStart(node, wStart);
        range.setEnd(node, wEnd);
      }

      const sel = window.getSelection();
      if (!sel) return false;
      sel.removeAllRanges();
      sel.addRange(range);
      return !sel.isCollapsed;
    };

    // ── Desktop: read selection immediately after mouse drag/click ────────────
    const onMouseUp = () => processSelection();
    document.addEventListener('mouseup', onMouseUp);

    // ── Mobile: pointer events on the container ───────────────────────────────
    // A tap (pointerdown → pointerup with < 8 px drift) on a text block selects
    // the word under the finger and shows the menu.
    // We use Pointer Events (supported iOS 13+, all Android Chrome) rather than
    // Touch Events because they fire even when touch-action:none is set and they
    // unify desktop/mobile without needing separate code paths.
    const container = containerRef.current;

    let pdPos: { x: number; y: number } | null = null;
    const DRAG_SQ = 8 * 8; // pixels²

    const onPD = (e: PointerEvent) => {
      // Only track if the press started on a text block
      const hit = e.target as Element | null;
      if (!hit || !findAncestorWithAttr(hit, 'data-block-idx')) { pdPos = null; return; }
      pdPos = { x: e.clientX, y: e.clientY };
    };

    const onPU = (e: PointerEvent) => {
      if (!pdPos) return;
      const dx  = e.clientX - pdPos.x;
      const dy  = e.clientY - pdPos.y;
      const pos = pdPos;
      pdPos = null;
      if (dx * dx + dy * dy > DRAG_SQ) return; // was a drag, not a tap
      // Tap confirmed: select word at the press position, then show menu
      if (selectWordAtPoint(pos.x, pos.y)) {
        setTimeout(processSelection, 30);
      }
    };

    if (container) {
      container.addEventListener('pointerdown', onPD);
      container.addEventListener('pointerup',   onPU);
    }

    return () => {
      document.removeEventListener('mouseup', onMouseUp);
      if (container) {
        container.removeEventListener('pointerdown', onPD);
        container.removeEventListener('pointerup',   onPU);
      }
    };
  }, [readerMode, pages]);

  // ── Escape key: cancel highlight mode / close panel ───────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (noteEditorOpen) return; // let NoteEditor handle it
      if (highlightsPanelOpen) { setHighlightsPanelOpen(false); return; }
      if (pendingSelection) { clearSelection(); return; }
      if (readerMode === 'highlighting') { exitHighlightMode(); return; }
      if (toolbarExpanded) { setToolbarExpanded(false); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [readerMode, toolbarExpanded, highlightsPanelOpen, pendingSelection, noteEditorOpen]);

  // ── Hint toast for highlight mode ─────────────────────────────────────────
  useEffect(() => {
    if (readerMode !== 'highlighting') { setHighlightHint(false); return; }
    setHighlightHint(true);
    const t = setTimeout(() => setHighlightHint(false), 2200);
    return () => clearTimeout(t);
  }, [readerMode]);

  // ── Navigate ───────────────────────────────────────────────────────────────
  const goTo = useCallback((page: number) => {
    const clamped = Math.max(0, Math.min(page, totalPages - 1));
    dragOffsetRef.current = 0;
    setDragOffset(0);
    setIsDragging(false);
    setIsCarousel(false);
    setCurrentPage(clamped);
    setToolbarExpanded(false);
    // Exit highlight mode on navigation (but keep reading mode intact)
    if (readerMode === 'highlighting') exitHighlightMode();
  }, [totalPages, readerMode]);

  // ── Highlight mode helpers ─────────────────────────────────────────────────
  const exitHighlightMode = () => {
    setReaderMode('reading');
    setPendingSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  const clearSelection = () => {
    setPendingSelection(null);
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
    if (touchStartPage.current === 0)             clamped = Math.min(0, clamped);
    if (touchStartPage.current >= totalPages - 1) clamped = Math.max(0, clamped);
    dragOffsetRef.current = clamped;
    setDragOffset(clamped);
  }, [totalPages, readerMode]);

  const handleTouchEnd = useCallback(() => {
    if (readerMode === 'highlighting') return;
    const pw        = pageWidthRef.current;
    const threshold = pw * 0.25;
    const offset    = dragOffsetRef.current;
    if (offset < -threshold)      goTo(touchStartPage.current + 1);
    else if (offset > threshold)  goTo(touchStartPage.current - 1);
    else                          goTo(touchStartPage.current);
  }, [goTo, readerMode]);

  // ── Desktop wheel ──────────────────────────────────────────────────────────
  const handleWheel = useCallback((e: WheelEvent) => {
    if (isCarousel) return;
    if (readerMode === 'highlighting') return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault();
    if (wheelLock.current) return;
    wheelLock.current = true;
    const dir = e.deltaY > 0 ? 1 : -1;
    setCurrentPage(prev => Math.max(0, Math.min(prev + dir, totalPages - 1)));
    setTimeout(() => { wheelLock.current = false; }, 550);
  }, [totalPages, isCarousel, readerMode]);

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

  // ── Pulse a highlight briefly (after navigating to it) ────────────────────
  const pulseHighlight = useCallback((id: string) => {
    setPulsingHighlightId(id);
    setTimeout(() => setPulsingHighlightId(null), 1400);
  }, []);

  if (totalPages === 0) return <div style={{ flex: 1 }} />;

  const translateX = -(currentPage * pageWidth) + dragOffset;

  // ── Click zones: left third | centre third | right third ──────────────────
  const handleAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, textarea, select')) return;

    // In highlight mode, taps go to text selection — don't navigate
    if (readerMode === 'highlighting') return;

    // First tap only closes the toolbar; action fires on the next tap
    if (toolbarExpanded) { setToolbarExpanded(false); return; }

    const { left, width } = e.currentTarget.getBoundingClientRect();
    const x     = e.clientX - left;
    const third = width / 3;
    if (x < third) {
      currentPage === 0 ? onBack() : goTo(currentPage - 1);
    } else if (x > third * 2) {
      goTo(currentPage + 1);
    } else {
      setIsCarousel(true);
    }
  };

  // ── Toolbar handlers ───────────────────────────────────────────────────────
  const handleToolbarExpand  = (e: React.MouseEvent) => { e.stopPropagation(); setToolbarExpanded(true); };
  const handleToolbarCollapse = (e: React.MouseEvent) => { e.stopPropagation(); setToolbarExpanded(false); };
  const handleExit = (e: React.MouseEvent) => {
    e.stopPropagation();
    saveProgress(chapter.id, currentPage); // flush immediately
    onBack();
  };
  const handleHighlightToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (readerMode === 'highlighting') {
      exitHighlightMode();
    } else {
      setReaderMode('highlighting');
    }
  };
  const handleViewHighlights = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHighlightsPanelOpen(true);
  };

  // ── Selection menu handlers ────────────────────────────────────────────────
  const handleSaveHighlight = () => {
    if (!pendingSelection) return;
    const h: BookHighlight = {
      id:           crypto.randomUUID(),
      chapterId:    chapter.id,
      pageId:       pendingSelection.pageId,
      pageIndex:    pendingSelection.pageIdx,
      blockIdx:     pendingSelection.blockIdx,
      startOffset:  pendingSelection.startOffset,
      endOffset:    pendingSelection.endOffset,
      selectedText: pendingSelection.text,
      createdAt:    new Date().toISOString(),
    };
    addHighlight(h);
    // Optimistic update: append directly to state so the mark renders
    // immediately without depending on a localStorage round-trip.
    setAllHighlights(prev => [...prev, h]);
    clearSelection();
    exitHighlightMode();
    setToolbarExpanded(false);
  };

  const handleOpenNoteEditor = () => {
    if (!pendingSelection) return;
    setNoteEditorOpen(true);
  };

  const handleSaveNote = (note: string) => {
    if (!pendingSelection) return;
    const h: BookHighlight = {
      id:           crypto.randomUUID(),
      chapterId:    chapter.id,
      pageId:       pendingSelection.pageId,
      pageIndex:    pendingSelection.pageIdx,
      blockIdx:     pendingSelection.blockIdx,
      startOffset:  pendingSelection.startOffset,
      endOffset:    pendingSelection.endOffset,
      selectedText: pendingSelection.text,
      note:         note || undefined,
      createdAt:    new Date().toISOString(),
    };
    addHighlight(h);
    // Optimistic update: same pattern as handleSaveHighlight.
    setAllHighlights(prev => [...prev, h]);
    setNoteEditorOpen(false);
    clearSelection();
    exitHighlightMode();
    setToolbarExpanded(false);
  };

  const handleCancelSelection = () => {
    clearSelection();
    // Keep highlight mode active (user may want to try again)
  };

  // ── Navigate to highlight (from panel) ───────────────────────────────────
  const handleNavigateToHighlight = (pageIndex: number, highlightId: string) => {
    goTo(pageIndex);
    // Slight delay to let page render, then pulse
    setTimeout(() => pulseHighlight(highlightId), 350);
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
        // In highlight mode: block browser rubber-band/swipe gestures so the
        // container doesn't show swipe feedback while the user is trying to select text.
        touchAction: readerMode === 'highlighting' ? 'none' : 'auto',
      }}
      onTouchStart={(!isCarousel && readerMode !== 'highlighting') ? handleTouchStart : undefined}
      onTouchMove={(!isCarousel && readerMode !== 'highlighting') ? handleTouchMove : undefined}
      onTouchEnd={(!isCarousel && readerMode !== 'highlighting') ? handleTouchEnd : undefined}
      onClick={!isCarousel ? handleAreaClick : undefined}
    >

      {/* ── Page strip ──────────────────────────────────────────────────────── */}
      <div
        style={{
          display:    'flex',
          width:      `${totalPages * 100}%`,
          height:     '100%',
          transform:  `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.32s cubic-bezier(0.25,0.1,0.25,1)',
          willChange: 'transform',
        }}
      >
        {pages.map((page, idx) => (
          <div
            key={page.id}
            data-page-idx={idx}
            style={{ width: `${100 / totalPages}%`, height: '100%', flexShrink: 0 }}
          >
            <BookPage
              chapter={chapter}
              page={page}
              pageIndex={idx}
              totalPages={totalPages}
              isPortrait={true}
              onComplete={onComplete}
              watermarkIdentity={mockWatermarkIdentity}
              isHighlightMode={readerMode === 'highlighting'}
              pageHighlights={allHighlights.filter(
                h => h.chapterId === chapter.id && h.pageId === page.id
              )}
              pulsingHighlightId={pulsingHighlightId}
            />
          </div>
        ))}
      </div>

      {/* ── Toolbar (collapsed trigger or expanded bar) ──────────────────────── */}
      {!isCarousel && (
        <ReaderToolbar
          mode={readerMode}
          expanded={toolbarExpanded}
          onExpand={handleToolbarExpand}
          onExit={handleExit}
          onHighlight={handleHighlightToggle}
          onViewHighlights={handleViewHighlights}
          onCollapse={handleToolbarCollapse}
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
            animation:  'toolbar-expand 0.22s cubic-bezier(0.34,1.56,0.64,1) both',
            backdropFilter: 'blur(10px)',
          }}
        >
          {'ontouchstart' in window
            ? 'Toque em uma palavra para selecioná-la'
            : 'Selecione o trecho que deseja destacar'}
        </div>
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
            {pages.map((page, idx) => {
              const isActive = idx === currentPage;
              return (
                <div
                  key={page.id}
                  onClick={() => goTo(idx)}
                  style={{ flexShrink: 0, scrollSnapAlign: 'center', width: `${thumbW}px`, height: `${thumbH}px`, borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', border: isActive ? '2px solid rgba(139,53,255,0.8)' : '2px solid rgba(255,255,255,0.08)', outline: isActive ? '4px solid rgba(139,53,255,0.15)' : 'none', transform: isActive ? 'scale(1.04)' : 'scale(1)', transition: 'transform 0.2s, border-color 0.2s', position: 'relative' }}
                >
                  <div style={{ width: `${pageWidth}px`, height: `${pageHeightRef.current}px`, transform: `scale(${thumbScale})`, transformOrigin: 'top left', pointerEvents: 'none', userSelect: 'none' }}>
                    <BookPage
                      chapter={chapter}
                      page={page}
                      pageIndex={idx}
                      totalPages={totalPages}
                      isPortrait={true}
                      watermarkIdentity={mockWatermarkIdentity}
                      pageHighlights={allHighlights.filter(
                        h => h.chapterId === chapter.id && h.pageId === page.id
                      )}
                      pulsingHighlightId={pulsingHighlightId}
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

      {/* ── Highlights panel ────────────────────────────────────────────────── */}
      {highlightsPanelOpen && (
        <HighlightsPanel
          chapterId={chapter.id}
          chapterTitle={chapter.title}
          onNavigate={handleNavigateToHighlight}
          onClose={() => setHighlightsPanelOpen(false)}
          onHighlightsChange={refreshHighlights}
        />
      )}
    </div>
  );
}
