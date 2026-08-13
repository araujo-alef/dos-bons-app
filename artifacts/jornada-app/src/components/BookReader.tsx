import { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import HTMLFlipBook from 'react-pageflip';
import { BookPage } from './BookPage';
import type { Chapter } from '@/mocks/data';

interface BookReaderProps {
  chapter: Chapter;
  onComplete: () => void;
}

// Fixed chrome height consumed by buttons + dots in portrait mode.
// 58 px = 10px gap-top + 40px button + 8px gap-bottom
// 22 px = dots (2px) + 10px padding-bottom + spacing
const PORTRAIT_CHROME_H = 80;

export function BookReader({ chapter, onComplete }: BookReaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<any>(null);
  const savedPageRef = useRef(0);

  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [isPortrait, setIsPortrait] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pages = chapter.pages ?? [];
  const totalPages = pages.length;

  // ─── Measure container ────────────────────────────────────────────────────
  const recalculate = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const cw = el.clientWidth;
    const ch = el.clientHeight;
    const portrait = cw < 768;

    if (portrait) {
      // Width: nearly full container (8 px breathing each side)
      const w = Math.max(240, Math.min(cw - 16, 520));
      // Height: full available height minus the button/dots row below the book
      const h = Math.max(360, ch - PORTRAIT_CHROME_H);
      setIsPortrait(true);
      setDims({ w, h });
    } else {
      // Desktop: two pages side-by-side. width = ONE page.
      const availW = cw - 64;
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

  const flipPrev = useCallback(() => {
    if (currentPage > 0) bookRef.current?.pageFlip()?.flipPrev('bottom');
  }, [currentPage]);

  const flipNext = useCallback(() => {
    if (currentPage < totalPages - 1) bookRef.current?.pageFlip()?.flipNext('bottom');
  }, [currentPage, totalPages]);

  if (!dims || totalPages === 0) {
    return <div ref={containerRef} className="flex-1" />;
  }

  const bookKey = isPortrait ? 'portrait' : 'landscape';
  const atStart = currentPage === 0;
  const atEnd = currentPage >= totalPages - 1;

  // ─── Shared button styles ─────────────────────────────────────────────────
  const btnBase: React.CSSProperties = {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.10)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'rgba(245,245,245,0.65)',
    transition: 'background 0.2s, border-color 0.2s, color 0.2s',
    padding: 0,
    flexShrink: 0,
  };
  const disabledExtra: React.CSSProperties = {
    opacity: 0.2,
    cursor: 'default',
    pointerEvents: 'none',
  };
  const onEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = 'rgba(178,102,255,0.12)';
    e.currentTarget.style.borderColor = 'rgba(178,102,255,0.4)';
    e.currentTarget.style.color = '#F5F5F5';
  };
  const onLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)';
    e.currentTarget.style.color = 'rgba(245,245,245,0.65)';
  };

  const PrevBtn = (
    <button
      onClick={flipPrev}
      aria-label="Página anterior"
      style={atStart ? { ...btnBase, ...disabledExtra } : btnBase}
      onMouseEnter={atStart ? undefined : onEnter}
      onMouseLeave={atStart ? undefined : onLeave}
    >
      <ChevronLeft style={{ width: '18px', height: '18px' }} strokeWidth={1.8} />
    </button>
  );

  const NextBtn = (
    <button
      onClick={flipNext}
      aria-label="Próxima página"
      style={atEnd ? { ...btnBase, ...disabledExtra } : btnBase}
      onMouseEnter={atEnd ? undefined : onEnter}
      onMouseLeave={atEnd ? undefined : onLeave}
    >
      <ChevronRight style={{ width: '18px', height: '18px' }} strokeWidth={1.8} />
    </button>
  );

  const FlipBook = (
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
      useMouseEvents={false}
      mobileScrollSupport={true}
      drawShadow={!isPortrait}
      maxShadowOpacity={0.3}
      showPageCorners={false}
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
  );

  // ─── Ambient glow (shared) ────────────────────────────────────────────────
  const Glow = (
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
  );

  // ─── PORTRAIT layout: flex-col so book fills height and buttons sit below ─
  if (isPortrait) {
    return (
      <div
        ref={containerRef}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          background: '#050505',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {Glow}

        {/* Book — takes all available space above the chrome */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            minHeight: 0,
            position: 'relative',
            zIndex: 20,
          }}
        >
          {FlipBook}
        </div>

        {/* Navigation buttons row */}
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            padding: '10px 0 8px',
            position: 'relative',
            zIndex: 25,
          }}
        >
          {PrevBtn}
          {NextBtn}
        </div>

        {/* Progress dots */}
        {totalPages > 1 && (
          <div
            aria-hidden="true"
            style={{
              flexShrink: 0,
              display: 'flex',
              justifyContent: 'center',
              gap: '5px',
              paddingBottom: '10px',
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

  // ─── LANDSCAPE layout: book centred, buttons on the sides ────────────────
  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#050505',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {Glow}

      <div style={{ position: 'relative', zIndex: 20, lineHeight: 0 }}>
        {FlipBook}
      </div>

      {/* Side buttons — absolutely positioned at vertical centre */}
      <button
        onClick={flipPrev}
        aria-label="Página anterior"
        style={{
          ...btnBase,
          position: 'absolute',
          left: '16px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 25,
          ...(atStart ? disabledExtra : {}),
        }}
        onMouseEnter={atStart ? undefined : onEnter}
        onMouseLeave={atStart ? undefined : onLeave}
      >
        <ChevronLeft style={{ width: '18px', height: '18px' }} strokeWidth={1.8} />
      </button>

      <button
        onClick={flipNext}
        aria-label="Próxima página"
        style={{
          ...btnBase,
          position: 'absolute',
          right: '16px',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 25,
          ...(atEnd ? disabledExtra : {}),
        }}
        onMouseEnter={atEnd ? undefined : onEnter}
        onMouseLeave={atEnd ? undefined : onLeave}
      >
        <ChevronRight style={{ width: '18px', height: '18px' }} strokeWidth={1.8} />
      </button>
    </div>
  );
}
