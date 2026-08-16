import { useLayoutEffect, useRef } from 'react';
import type { Lesson } from '@/mocks/data';
import { flattenContentBlocks, buildLessonPages, type DynamicPage } from '@/lib/pagination';
import { TOOLBAR_CLEARANCE_CSS } from '@/lib/readerLayout';
import { PageBlock } from './BookPage';

// Must match the `isPortrait` typo tokens in BookPage.tsx exactly — this app
// only ever renders portrait, so there's only one set of tokens to mirror.
const TYPO = { body: 19, lineHeight: 1.85, px: 28, py: 28, pyTop: 54 };

// Small cushion subtracted from the packable height, on top of the real
// measured content area. Absorbs residual sub-pixel/font-hinting rounding
// between this measurement pass and the real page's final render — cheap
// insurance against a block landing right on the edge and clipping by a
// couple of px. Never the fix for a real miscalculation, just a buffer.
const SAFETY_BUFFER = 12;

interface BookMeasurerProps {
  lessons:         Lesson[];
  containerWidth:  number;
  containerHeight: number;
  onMeasured:      (pages: Map<number, DynamicPage[]>) => void;
}

/**
 * Renders every lesson's text blocks off-screen, at the reader's real
 * current width, then reads back their actual rendered heights to decide
 * where pages should break — so pagination always matches this device's
 * real fonts/line-wrapping instead of a fixed pre-authored guess. Runs once
 * per lesson set + container size (re-fires on resize/orientation change).
 */
export function BookMeasurer({ lessons, containerWidth, containerHeight, onMeasured }: BookMeasurerProps) {
  const blockRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const contentAreaRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (containerWidth <= 0 || containerHeight <= 0) return;
    const contentAreaEl = contentAreaRef.current;
    if (!contentAreaEl) return;
    // Reusing the exact same absolute-positioned + calc() formula as the
    // real page means the browser resolves env(safe-area-inset-bottom) for
    // us — no need to duplicate that calculation in JS.
    const availableHeight = contentAreaEl.clientHeight - TYPO.pyTop - SAFETY_BUFFER;

    const result = new Map<number, DynamicPage[]>();
    for (const lesson of lessons) {
      if (lesson.status === 'upcoming') continue;
      const flat = flattenContentBlocks(lesson);
      const heights = flat.map((_, i) => {
        const el = blockRefs.current.get(`${lesson.id}-${i}`);
        return el ? el.getBoundingClientRect().height : 0;
      });
      result.set(lesson.id, buildLessonPages(flat, heights, availableHeight));
    }
    onMeasured(result);
  }, [lessons, containerWidth, containerHeight]);

  return (
    <div
      aria-hidden="true"
      style={{ position: 'fixed', top: 0, left: -99999, width: containerWidth, height: containerHeight, visibility: 'hidden', pointerEvents: 'none' }}
    >
      <div style={{ position: 'relative', width: containerWidth, height: containerHeight }}>
        <div
          ref={contentAreaRef}
          style={{
            position: 'absolute', top: '1px', left: 0, right: 0,
            bottom: TOOLBAR_CLEARANCE_CSS,
            padding: `${TYPO.pyTop}px ${TYPO.px}px 0`,
          }}
        />
      </div>
      {lessons.map(lesson => {
        if (lesson.status === 'upcoming') return null;
        const flat = flattenContentBlocks(lesson);
        return (
          <div key={lesson.id} style={{ display: 'flex', flexDirection: 'column', width: containerWidth - TYPO.px * 2 }}>
            {flat.map((fb, i) => fb.block.type === 'text' && (
              // overflow:hidden forces this wrapper to establish its own
              // block-formatting context, which keeps the block's own
              // bottom margin contained inside the wrapper's measured
              // height instead of collapsing through it — without this,
              // getBoundingClientRect() below silently drops that margin
              // and every page ends up packed a few px too tight.
              <div key={i} ref={el => { if (el) blockRefs.current.set(`${lesson.id}-${i}`, el); }} style={{ overflow: 'hidden' }}>
                <PageBlock
                  block={fb.block}
                  blockIdx={fb.originBlockIdx}
                  typo={TYPO}
                  isPortrait
                  isHighlightMode={false}
                  blockHighlights={[]}
                />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
