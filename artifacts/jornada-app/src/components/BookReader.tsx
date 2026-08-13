import { useRef, useState, useEffect, useCallback } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { BookPage } from './BookPage';
import type { Chapter } from '@/mocks/data';

interface BookReaderProps {
  chapter: Chapter;
  onComplete: () => void;
}

export function BookReader({ chapter, onComplete }: BookReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<any>(null);

  // savedPageRef persists across key-driven remounts so we can restore position
  const savedPageRef = useRef(0);

  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [isPortrait, setIsPortrait] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pages = chapter.pages ?? [];
  const totalPages = pages.length;

  // ─── Measure container, decide single vs double page ─────────────────────
  const recalculate = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    // Use actual container width — not window.innerWidth — so layouts with
    // max-width containers behave correctly.
    const cw = el.clientWidth;
    const ch = el.clientHeight;

    // Single-page mode whenever the container is narrower than 768 px.
    const portrait = cw < 768;

    if (portrait) {
      // One page fills (almost) the entire container width.
      // Subtract a small visual breathing margin (8 px each side = 16 px total).
      const w = Math.max(240, Math.min(cw - 16, 520));
      const h = Math.max(360, Math.min(ch - 16, Math.round(w * 1.42)));
      setIsPortrait(true);
      setDims({ w, h });
    } else {
      // Two pages side-by-side; width here is ONE page.
      const availW = cw - 64; // 32 px margin each side
      const w = Math.max(260, Math.min(Math.floor(availW / 2), 500));
      const h = Math.max(380, Math.min(ch - 32, Math.round(w * 1.38)));
      setIsPortrait(false);
      setDims({ w, h });
    }
  }, []);

  useEffect(() => {
    recalculate();
    const ro = new ResizeObserver(recalculate);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [recalculate]);

  // ─── Navigation ───────────────────────────────────────────────────────────
  const handleFlip = useCallback((e: any) => {
    const page = e.data as number;
    setCurrentPage(page);
    savedPageRef.current = page;
  }, []);

  // ─── Invisible tap zones (click left = prev, click right = next) ──────────
  // We intercept the CLICK event only; the book's own touch handlers receive
  // the raw pointer events for swipe/drag (they are attached to its canvas
  // element and are not blocked by these divs when we use onClickCapture).
  const flipPrev = useCallback(() => bookRef.current?.pageFlip()?.flipPrev('bottom'), []);
  const flipNext = useCallback(() => bookRef.current?.pageFlip()?.flipNext('bottom'), []);

  // ─── Render ───────────────────────────────────────────────────────────────
  if (!dims || totalPages === 0) {
    return <div ref={containerRef} className="flex-1" />;
  }

  // key forces a full remount of HTMLFlipBook when the layout mode switches so
  // StPageFlip re-initialises with the correct portrait flag and dimensions.
  // startPage restores the reader's position after the remount.
  const bookKey = isPortrait ? 'portrait' : 'landscape';

  return (
    <div
      ref={containerRef}
      className="flex-1 flex items-center justify-center relative"
      style={{ background: '#050505', overflow: 'hidden' }}
    >
      {/* Ambient purple glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 55% 45% at 50% 50%, rgba(139,53,255,0.07) 0%, transparent 65%)',
          pointerEvents: 'none',
        }}
      />

      {/* Tap-zone overlay (click only; swipe passes through to the book canvas) */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          zIndex: 30,
          pointerEvents: 'none', // default: transparent
        }}
      >
        <div
          style={{ flex: 1, pointerEvents: 'auto', cursor: 'default' }}
          onClick={flipPrev}
        />
        <div
          style={{ flex: 1, pointerEvents: 'auto', cursor: 'default' }}
          onClick={flipNext}
        />
      </div>

      {/* Book — z-index above ambient glow, below tap zones.
          disableFlipByClick keeps the book from double-firing on click. */}
      <div style={{ position: 'relative', zIndex: 20, lineHeight: 0 }}>
        <HTMLFlipBook
          key={bookKey}
          ref={bookRef}
          width={dims.w}
          height={dims.h}
          size="fixed"
          minWidth={200}
          maxWidth={560}
          minHeight={300}
          maxHeight={900}
          showCover={false}
          usePortrait={isPortrait}
          flippingTime={prefersReducedMotion ? 1 : 520}
          mobileScrollSupport={false}
          useMouseEvents={true}
          drawShadow={!isPortrait}
          maxShadowOpacity={0.3}
          showPageCorners={!isPortrait}
          disableFlipByClick={true}
          startPage={savedPageRef.current}
          onFlip={handleFlip}
          className=""
          style={{}}
        >
          {pages.map((page, idx) => (
            <BookPage
              key={page.id}
              chapter={chapter}
              page={page}
              pageIndex={idx}
              totalPages={totalPages}
              isPortrait={isPortrait}
              onComplete={onComplete}
            />
          ))}
        </HTMLFlipBook>
      </div>

      {/* Discrete progress dots — mobile only */}
      {isPortrait && totalPages > 1 && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: '8px',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            gap: '5px',
            pointerEvents: 'none',
          }}
        >
          {pages.map((_, idx) => (
            <div
              key={idx}
              style={{
                width: idx === currentPage ? '16px' : '4px',
                height: '2px',
                borderRadius: '2px',
                background:
                  idx === currentPage
                    ? 'rgba(178,102,255,0.65)'
                    : 'rgba(255,255,255,0.12)',
                transition: 'all 0.35s ease',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
