import { useRef } from 'react';
import { BookPage } from './BookPage';
import type { Chapter } from '@/mocks/data';

interface BookReaderProps {
  chapter: Chapter;
  onComplete: () => void;
}

export function BookReader({ chapter, onComplete }: BookReaderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const pages = chapter.pages ?? [];
  const totalPages = pages.length;

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
