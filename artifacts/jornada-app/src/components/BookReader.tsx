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
  const carouselRef    = useRef<HTMLDivElement>(null);
  const pageWidthRef   = useRef(0);
  const pageHeightRef  = useRef(0);
  const dragOffsetRef  = useRef(0);
  const touchStartX    = useRef(0);
  const touchStartPage = useRef(0);
  const wheelLock      = useRef(false);

  const [currentPage, setCurrentPage] = useState(0);
  const [dragOffset,  setDragOffset]  = useState(0);
  const [isDragging,  setIsDragging]  = useState(false);
  const [pageWidth,   setPageWidth]   = useState(0);
  const [isCarousel,  setIsCarousel]  = useState(false);

  const pages      = chapter.pages ?? [];
  const totalPages = pages.length;

  // ─── Measure container ────────────────────────────────────────────────────
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

  // ─── Navigate ─────────────────────────────────────────────────────────────
  const goTo = useCallback((page: number) => {
    const clamped = Math.max(0, Math.min(page, totalPages - 1));
    dragOffsetRef.current = 0;
    setDragOffset(0);
    setIsDragging(false);
    setIsCarousel(false);
    setCurrentPage(clamped);
  }, [totalPages]);

  // ─── Touch: one page per gesture ──────────────────────────────────────────
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current    = e.touches[0].clientX;
    touchStartPage.current = currentPage;
    setIsDragging(true);
  }, [currentPage]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    const pw = pageWidthRef.current;
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
    if (offset < -threshold)      goTo(touchStartPage.current + 1);
    else if (offset > threshold)  goTo(touchStartPage.current - 1);
    else                          goTo(touchStartPage.current);
  }, [goTo]);

  // ─── Desktop wheel ────────────────────────────────────────────────────────
  const handleWheel = useCallback((e: WheelEvent) => {
    if (isCarousel) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault();
    if (wheelLock.current) return;
    wheelLock.current = true;
    const dir = e.deltaY > 0 ? 1 : -1;
    setCurrentPage(prev => Math.max(0, Math.min(prev + dir, totalPages - 1)));
    setTimeout(() => { wheelLock.current = false; }, 550);
  }, [totalPages, isCarousel]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // ─── Scroll carousel to current page when it opens ───────────────────────
  useEffect(() => {
    if (!isCarousel) return;
    const el = carouselRef.current;
    if (!el) return;
    // Each thumb: 58% of container width + 12px gap. Scroll so current is centred.
    const thumbW = pageWidthRef.current * 0.58 + 12;
    const offset = currentPage * thumbW - pageWidthRef.current / 2 + thumbW / 2;
    el.scrollLeft = Math.max(0, offset);
  }, [isCarousel]); // only on open

  if (totalPages === 0) return <div style={{ flex: 1 }} />;

  const translateX = -(currentPage * pageWidth) + dragOffset;

  // ─── Click zones: left third | centre third | right third ─────────────────
  const handleAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, a, input, textarea, select')) return;
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

  // ─── Thumbnail dimensions (for the carousel overlay) ─────────────────────
  const thumbW = pageWidth * 0.58;
  const thumbH = pageHeightRef.current * 0.58;
  // Scale factor to fit BookPage (full page size) into the thumbnail box
  const thumbScale = 0.58;

  return (
    <div
      ref={containerRef}
      style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#050505', cursor: 'pointer' }}
      onTouchStart={!isCarousel ? handleTouchStart : undefined}
      onTouchMove={!isCarousel ? handleTouchMove : undefined}
      onTouchEnd={!isCarousel ? handleTouchEnd : undefined}
      onClick={!isCarousel ? handleAreaClick : undefined}
    >

      {/* ── Page strip ─────────────────────────────────────────────────────── */}
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
          <div key={page.id} style={{ width: `${100 / totalPages}%`, height: '100%', flexShrink: 0 }}>
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

      {/* ── Centre-tap hint ─────────────────────────────────────────────────── */}
      {!isCarousel && (
        <div
          aria-hidden="true"
          style={{
            position:  'absolute',
            bottom:    '14px',
            left:      '50%',
            transform: 'translateX(-50%)',
            display:   'flex',
            gap:       '4px',
            pointerEvents: 'none',
          }}
        >
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: i === 1 ? '16px' : '4px',
              height: '2px',
              borderRadius: '2px',
              background: i === 1 ? 'rgba(40,20,8,0.35)' : 'rgba(40,20,8,0.15)',
              transition: 'all 0.3s',
            }} />
          ))}
        </div>
      )}

      {/* ── Carousel overlay ────────────────────────────────────────────────── */}
      {isCarousel && (
        <div
          style={{
            position:   'absolute',
            inset:      0,
            zIndex:     100,
            background: 'rgba(5,5,5,0.96)',
            display:    'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap:        '20px',
          }}
          onClick={() => setIsCarousel(false)} // tap backdrop to close
        >
          {/* Label */}
          <span style={{
            fontSize:      10,
            fontWeight:    600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color:         'rgba(255,255,255,0.30)',
          }}>
            Páginas
          </span>

          {/* Thumbnail strip */}
          <div
            ref={carouselRef}
            onClick={e => e.stopPropagation()} // don't close when scrolling strip
            style={{
              display:        'flex',
              gap:            '12px',
              overflowX:      'auto',
              overflowY:      'hidden',
              scrollSnapType: 'x mandatory',
              padding:        `0 ${(pageWidth - thumbW) / 2}px`,
              scrollbarWidth: 'none',
              width:          '100%',
              alignItems:     'center',
            }}
            className="hide-scrollbar"
          >
            {pages.map((page, idx) => {
              const isActive = idx === currentPage;
              return (
                <div
                  key={page.id}
                  onClick={() => goTo(idx)}
                  style={{
                    flexShrink:   0,
                    scrollSnapAlign: 'center',
                    width:        `${thumbW}px`,
                    height:       `${thumbH}px`,
                    borderRadius: '10px',
                    overflow:     'hidden',
                    cursor:       'pointer',
                    border:       isActive
                      ? '2px solid rgba(139,53,255,0.8)'
                      : '2px solid rgba(255,255,255,0.08)',
                    outline:      isActive ? '4px solid rgba(139,53,255,0.15)' : 'none',
                    transform:    isActive ? 'scale(1.04)' : 'scale(1)',
                    transition:   'transform 0.2s, border-color 0.2s',
                    position:     'relative',
                  }}
                >
                  {/* Scaled-down page */}
                  <div style={{
                    width:        `${pageWidth}px`,
                    height:       `${pageHeightRef.current}px`,
                    transform:    `scale(${thumbScale})`,
                    transformOrigin: 'top left',
                    pointerEvents: 'none',
                    userSelect:   'none',
                  }}>
                    <BookPage
                      chapter={chapter}
                      page={page}
                      pageIndex={idx}
                      totalPages={totalPages}
                      isPortrait={true}
                    />
                  </div>

                  {/* Page number badge */}
                  <div style={{
                    position:   'absolute',
                    bottom:     '6px',
                    right:      '8px',
                    fontSize:   '9px',
                    fontFamily: 'monospace',
                    color:      isActive ? 'rgba(139,53,255,0.9)' : 'rgba(40,20,8,0.45)',
                    fontWeight: 600,
                  }}>
                    {idx + 1}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Close hint */}
          <span
            style={{
              fontSize:      11,
              color:         'rgba(255,255,255,0.20)',
              letterSpacing: '0.04em',
              cursor:        'pointer',
            }}
            onClick={() => setIsCarousel(false)}
          >
            toque fora para fechar
          </span>
        </div>
      )}
    </div>
  );
}
