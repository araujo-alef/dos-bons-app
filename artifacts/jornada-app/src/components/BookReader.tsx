import { useRef, useEffect, useCallback } from 'react';
import { BookPage } from './BookPage';
import type { Chapter } from '@/mocks/data';

interface BookReaderProps {
  chapter: Chapter;
  onComplete: () => void;
}

export function BookReader({ chapter, onComplete }: BookReaderProps) {
  const scrollRef  = useRef<HTMLDivElement>(null);
  const locking    = useRef(false);   // prevent multi-page jump per gesture
  const pages      = chapter.pages ?? [];
  const totalPages = pages.length;

  // Convert vertical wheel / trackpad delta → horizontal page snap on desktop
  const handleWheel = useCallback((e: WheelEvent) => {
    const el = scrollRef.current;
    if (!el) return;

    // Let pure horizontal trackpad swipes pass through (browser handles them)
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

    e.preventDefault();
    if (locking.current) return;

    const pageW      = el.clientWidth;
    const current    = Math.round(el.scrollLeft / pageW);
    const direction  = e.deltaY > 0 ? 1 : -1;
    const next       = Math.max(0, Math.min(current + direction, totalPages - 1));

    if (next === current) return;

    locking.current = true;
    el.scrollTo({ left: next * pageW, behavior: 'smooth' });
    setTimeout(() => { locking.current = false; }, 550);
  }, [totalPages]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  if (totalPages === 0) {
    return <div style={{ flex: 1 }} />;
  }

  return (
    <div
      ref={scrollRef}
      className="hide-scrollbar"
      style={{
        flex: 1,
        display: 'flex',
        overflowX: 'auto',
        overflowY: 'hidden',
        scrollSnapType: 'x mandatory',
        scrollbarWidth: 'none',
        background: '#050505',
        position: 'relative',
      }}
    >
      {pages.map((page, idx) => (
        <div
          key={page.id}
          style={{
            flexShrink: 0,
            width: '100%',
            height: '100%',
            scrollSnapAlign: 'start',
          }}
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
  );
}
