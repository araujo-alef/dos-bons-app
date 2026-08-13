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
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [isPortrait, setIsPortrait] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const pages = chapter.pages ?? [];
  const totalPages = pages.length;

  // Measure container and compute book dimensions
  const recalculate = useCallback(() => {
    if (!containerRef.current) return;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    const portrait = window.innerWidth < 768;
    setIsPortrait(portrait);

    if (portrait) {
      // Single page: fill most of the available space
      const w = Math.max(240, Math.min(cw - 16, 440));
      const h = Math.max(340, Math.min(ch - 12, Math.round(w * 1.42)));
      setDims({ w, h });
    } else {
      // Two pages side-by-side
      const maxPageW = Math.floor((cw - 64) / 2);
      const w = Math.max(260, Math.min(maxPageW, 460));
      const h = Math.max(380, Math.min(ch - 24, Math.round(w * 1.38)));
      setDims({ w, h });
    }
  }, []);

  useEffect(() => {
    recalculate();
    const ro = new ResizeObserver(recalculate);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [recalculate]);

  const flipNext = useCallback(() => {
    bookRef.current?.pageFlip()?.flipNext('bottom');
  }, []);

  const flipPrev = useCallback(() => {
    bookRef.current?.pageFlip()?.flipPrev('bottom');
  }, []);

  if (!dims || totalPages === 0) {
    return <div ref={containerRef} className="flex-1" />;
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 flex items-center justify-center overflow-hidden relative"
      style={{ background: '#050505' }}
    >
      {/* Ambient purple glow behind book */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 55% 45% at 50% 50%, rgba(139,53,255,0.07) 0%, transparent 65%)',
          pointerEvents: 'none',
        }}
      />

      {/* Invisible tap zones — left half = prev, right half = next */}
      <div className="absolute inset-0 flex z-10 pointer-events-none">
        <div
          className="flex-1 pointer-events-auto"
          onClick={flipPrev}
          aria-label="Página anterior"
        />
        <div
          className="flex-1 pointer-events-auto"
          onClick={flipNext}
          aria-label="Próxima página"
        />
      </div>

      {/* Book — above the tap zones so drag/swipe works naturally */}
      <div className="relative z-20" style={{ pointerEvents: 'all' }}>
        <HTMLFlipBook
          ref={bookRef}
          width={dims.w}
          height={dims.h}
          size="fixed"
          minWidth={200}
          maxWidth={600}
          minHeight={300}
          maxHeight={900}
          showCover={false}
          usePortrait={isPortrait}
          flippingTime={prefersReducedMotion ? 1 : 550}
          mobileScrollSupport={false}
          useMouseEvents={true}
          drawShadow={!isPortrait}
          startPage={0}
          onFlip={(e: any) => setCurrentPage(e.data)}
          className=""
          style={{}}
          maxShadowOpacity={0.35}
          showPageCorners={true}
          disableFlipByClick={false}
        >
          {pages.map((page, idx) => (
            <BookPage
              key={page.id}
              chapter={chapter}
              page={page}
              pageIndex={idx}
              totalPages={totalPages}
              onComplete={onComplete}
            />
          ))}
        </HTMLFlipBook>
      </div>

      {/* Subtle page progress at the very bottom (only on mobile, very discrete) */}
      {isPortrait && totalPages > 1 && (
        <div
          className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 pointer-events-none"
          aria-hidden="true"
        >
          {pages.map((_, idx) => (
            <div
              key={idx}
              style={{
                width: idx === currentPage ? '14px' : '4px',
                height: '2px',
                borderRadius: '2px',
                background: idx === currentPage ? 'rgba(178,102,255,0.6)' : 'rgba(255,255,255,0.12)',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
