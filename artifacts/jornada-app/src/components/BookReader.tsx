import { useRef, useState, useEffect, useCallback } from 'react';
import { BookPage } from './BookPage';
import type { Chapter } from '@/mocks/data';

interface BookReaderProps {
  chapter:    Chapter;
  onComplete: () => void;
  onBack:     () => void;
}


export function BookReader({ chapter, onComplete, onBack }: BookReaderProps) {
  const containerRef   = useRef<HTMLDivElement>(null);
  const pageWidthRef   = useRef(0);          // always-fresh page width (px)
  const dragOffsetRef  = useRef(0);          // always-fresh drag offset (px)
  const touchStartX    = useRef(0);
  const touchStartPage = useRef(0);
  const wheelLock      = useRef(false);

  const [currentPage, setCurrentPage] = useState(0);
  const [dragOffset,  setDragOffset]  = useState(0);  // drives re-render
  const [isDragging,  setIsDragging]  = useState(false);
  const [pageWidth,   setPageWidth]   = useState(0);  // drives re-render for layout

  const pages      = chapter.pages ?? [];
  const totalPages = pages.length;

  // ─── Measure container width ───────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      pageWidthRef.current = w;
      setPageWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ─── Navigate to a page ────────────────────────────────────────────────────
  const goTo = useCallback((page: number) => {
    const clamped = Math.max(0, Math.min(page, totalPages - 1));
    dragOffsetRef.current = 0;
    setDragOffset(0);
    setIsDragging(false);
    setCurrentPage(clamped);
  }, [totalPages]);

  // ─── Touch handlers (one page per gesture) ────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current    = e.touches[0].clientX;
    touchStartPage.current = currentPage;
    setIsDragging(true);
  }, [currentPage]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const dx  = e.touches[0].clientX - touchStartX.current;
    const pw  = pageWidthRef.current;
    // Clamp to ±1 page; resist at edges
    let clamped = Math.max(-pw, Math.min(pw, dx));
    if (touchStartPage.current === 0)             clamped = Math.min(0, clamped);
    if (touchStartPage.current >= totalPages - 1) clamped = Math.max(0, clamped);
    dragOffsetRef.current = clamped;
    setDragOffset(clamped);
  }, [totalPages]);

  const handleTouchEnd = useCallback(() => {
    const pw        = pageWidthRef.current;
    const threshold = pw * 0.25;
    const offset    = dragOffsetRef.current;
    if (offset < -threshold) {
      goTo(touchStartPage.current + 1);
    } else if (offset > threshold) {
      goTo(touchStartPage.current - 1);
    } else {
      goTo(touchStartPage.current);   // snap back
    }
  }, [goTo]);

  // ─── Desktop: vertical wheel → page nav ───────────────────────────────────
  const handleWheel = useCallback((e: WheelEvent) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault();
    if (wheelLock.current) return;
    wheelLock.current = true;
    const dir = e.deltaY > 0 ? 1 : -1;
    setCurrentPage(prev => Math.max(0, Math.min(prev + dir, totalPages - 1)));
    setTimeout(() => { wheelLock.current = false; }, 550);
  }, [totalPages]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  if (totalPages === 0) return <div style={{ flex: 1 }} />;

  const translateX = -(currentPage * pageWidth) + dragOffset;

  // Click anywhere on the page: left half = prev/back, right half = next.
  // Skips interactive elements so buttons inside BookPage still work.
  const handleAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, textarea, select')) return;
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const isLeft = e.clientX < left + width / 2;
    if (isLeft) {
      currentPage === 0 ? onBack() : goTo(currentPage - 1);
    } else {
      goTo(currentPage + 1);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#050505', cursor: 'pointer' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleAreaClick}
    >

      {/* Page strip — translate-based, no scroll */}
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
            style={{ width: `${100 / totalPages}%`, height: '100%', flexShrink: 0 }}
          >
            <BookPage
              chapter={chapter}
              page={page}
              pageIndex={idx}
              totalPages={totalPages}
              isPortrait={true}
              onComplete={onComplete}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
