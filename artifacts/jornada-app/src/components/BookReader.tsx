import { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
      const w = Math.max(240, Math.min(cw - 16, 520));
      const h = Math.max(360, Math.min(ch - 16, Math.round(w * 1.42)));
      setIsPortrait(true);
      setDims({ w, h });
    } else {
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

  // ─── Render ───────────────────────────────────────────────────────────────
  if (!dims || totalPages === 0) {
    return <div ref={containerRef} className="flex-1" />;
  }

  const bookKey = isPortrait ? 'portrait' : 'landscape';
  const atStart = currentPage === 0;
  const atEnd = currentPage >= totalPages - 1;

  const btnBase: React.CSSProperties = {
    position: 'absolute',
    zIndex: 25,
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
    transition: 'background 0.2s, border-color 0.2s, color 0.2s, opacity 0.2s',
    padding: 0,
  };

  // Portrait: buttons sit centred horizontally just above the progress dots
  // Landscape: buttons float at the left / right vertical centres
  const prevBtnStyle: React.CSSProperties = isPortrait
    ? { ...btnBase, bottom: '40px', left: 'calc(50% - 48px)' }
    : { ...btnBase, left: '16px', top: '50%', transform: 'translateY(-50%)' };

  const nextBtnStyle: React.CSSProperties = isPortrait
    ? { ...btnBase, bottom: '40px', right: 'calc(50% - 48px)' }
    : { ...btnBase, right: '16px', top: '50%', transform: 'translateY(-50%)' };

  const disabledExtra: React.CSSProperties = { opacity: 0.2, cursor: 'default', pointerEvents: 'none' };

  const onBtnEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = 'rgba(178,102,255,0.12)';
    e.currentTarget.style.borderColor = 'rgba(178,102,255,0.4)';
    e.currentTarget.style.color = '#F5F5F5';
  };
  const onBtnLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)';
    e.currentTarget.style.color = 'rgba(245,245,245,0.65)';
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 flex items-center justify-center relative"
      style={{ background: '#050505', overflow: 'hidden' }}
    >
      {/* Ambient glow */}
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

      {/* Book */}
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
      </div>

      {/* Prev button */}
      <button
        onClick={flipPrev}
        aria-label="Página anterior"
        style={atStart ? { ...prevBtnStyle, ...disabledExtra } : prevBtnStyle}
        onMouseEnter={atStart ? undefined : onBtnEnter}
        onMouseLeave={atStart ? undefined : onBtnLeave}
      >
        <ChevronLeft style={{ width: '18px', height: '18px' }} strokeWidth={1.8} />
      </button>

      {/* Next button */}
      <button
        onClick={flipNext}
        aria-label="Próxima página"
        style={atEnd ? { ...nextBtnStyle, ...disabledExtra } : nextBtnStyle}
        onMouseEnter={atEnd ? undefined : onBtnEnter}
        onMouseLeave={atEnd ? undefined : onBtnLeave}
      >
        <ChevronRight style={{ width: '18px', height: '18px' }} strokeWidth={1.8} />
      </button>

      {/* Progress dots — mobile only */}
      {isPortrait && totalPages > 1 && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: '10px',
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
