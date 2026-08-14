import { useRef, useEffect, useCallback, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { BookPage } from './BookPage';
import type { Chapter } from '@/mocks/data';

interface BookReaderProps {
  chapter:    Chapter;
  onComplete: () => void;
  onBack:     () => void;   // called when left arrow is tapped on page 0
}

const ARROW_BTN: React.CSSProperties = {
  position:        'absolute',
  top:             '14px',
  zIndex:          50,
  width:           '32px',
  height:          '32px',
  display:         'flex',
  alignItems:      'center',
  justifyContent:  'center',
  background:      'transparent',
  border:          'none',
  padding:         0,
  cursor:          'pointer',
  color:           'rgba(0,0,0,0.45)',
  transition:      'color 0.15s',
};

export function BookReader({ chapter, onComplete, onBack }: BookReaderProps) {
  const scrollRef  = useRef<HTMLDivElement>(null);
  const locking    = useRef(false);
  const [currentPage, setCurrentPage] = useState(0);

  const pages      = chapter.pages ?? [];
  const totalPages = pages.length;

  // ─── Scroll to a page index ───────────────────────────────────────────────
  const goTo = useCallback((page: number) => {
    const el = scrollRef.current;
    if (!el || locking.current) return;
    const clamped = Math.max(0, Math.min(page, totalPages - 1));
    locking.current = true;
    el.scrollTo({ left: clamped * el.clientWidth, behavior: 'smooth' });
    setTimeout(() => { locking.current = false; }, 550);
  }, [totalPages]);

  // ─── Sync state from scroll position ──────────────────────────────────────
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCurrentPage(Math.round(el.scrollLeft / el.clientWidth));
  }, []);

  // ─── Desktop: convert vertical wheel → page nav ───────────────────────────
  const handleWheel = useCallback((e: WheelEvent) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return; // native horizontal swipe
    e.preventDefault();
    if (locking.current) return;
    const el = scrollRef.current;
    if (!el) return;
    const current = Math.round(el.scrollLeft / el.clientWidth);
    goTo(current + (e.deltaY > 0 ? 1 : -1));
  }, [goTo]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  if (totalPages === 0) return <div style={{ flex: 1 }} />;

  const atStart = currentPage === 0;
  const atEnd   = currentPage >= totalPages - 1;

  return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#050505' }}>

      {/* Left arrow — back to home on first page, prev page otherwise */}
      <button
        aria-label={atStart ? 'Voltar' : 'Página anterior'}
        onClick={() => atStart ? onBack() : goTo(currentPage - 1)}
        style={{ ...ARROW_BTN, left: '14px' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'rgba(0,0,0,0.75)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(0,0,0,0.45)')}
      >
        <ArrowLeft style={{ width: '20px', height: '20px' }} />
      </button>

      {/* Right arrow — next page (hidden on last page) */}
      {!atEnd && (
        <button
          aria-label="Próxima página"
          onClick={() => goTo(currentPage + 1)}
          style={{ ...ARROW_BTN, right: '14px' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(0,0,0,0.75)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(0,0,0,0.45)')}
        >
          <ArrowRight style={{ width: '20px', height: '20px' }} />
        </button>
      )}

      {/* Scrollable page strip */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="hide-scrollbar"
        style={{
          display:          'flex',
          width:            '100%',
          height:           '100%',
          overflowX:        'auto',
          overflowY:        'hidden',
          scrollSnapType:   'x mandatory',
          scrollbarWidth:   'none',
        }}
      >
        {pages.map((page, idx) => (
          <div
            key={page.id}
            style={{ flexShrink: 0, width: '100%', height: '100%', scrollSnapAlign: 'start' }}
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
