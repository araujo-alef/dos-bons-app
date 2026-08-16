import type { Lesson, ContentBlock } from '@/mocks/data';

/**
 * A content block tagged with its ORIGINAL authored location (the page id +
 * index it lives at in mocks/data.ts). This identity never changes no matter
 * how the block gets packed onto a screen at runtime — it's what highlights
 * and reading progress anchor to, so a saved highlight/position stays valid
 * even if a later measurement pass (different device, resize) puts that same
 * block on a different physical page.
 */
export interface FlatBlock {
  block:         ContentBlock;
  originPageId:  number;
  originBlockIdx: number;
}

export type DynamicPage =
  | { kind: 'cover' }
  | { kind: 'content'; items: FlatBlock[] };

/** Every content block of a lesson (cover excluded), in reading order, each
 *  tagged with where it was originally authored. */
export function flattenContentBlocks(lesson: Lesson): FlatBlock[] {
  const contentPages = (lesson.pages ?? []).filter(p => p.type !== 'cover');
  return contentPages.flatMap(page =>
    page.blocks.map((block, originBlockIdx) => ({ block, originPageId: page.id, originBlockIdx }))
  );
}

/**
 * Greedily packs a lesson's flat blocks into pages that fit `availableHeight`.
 * `heights[i]` is the measured rendered height (incl. margin) of `flat[i]`
 * at the current device width. Non-text blocks (reflection/practice/audio/
 * video) always get a page of their own — they render as a flex:1 card that
 * fills whatever space is available, the same as they're authored today, so
 * there's nothing to measure or pack for them.
 */
export function packBlocks(flat: FlatBlock[], heights: number[], availableHeight: number): FlatBlock[][] {
  const pages: FlatBlock[][] = [];
  let current: FlatBlock[] = [];
  let currentHeight = 0;

  const flush = () => {
    if (current.length) pages.push(current);
    current = [];
    currentHeight = 0;
  };

  flat.forEach((fb, i) => {
    if (fb.block.type !== 'text') {
      flush();
      pages.push([fb]);
      return;
    }
    const h = heights[i] ?? 0;
    if (current.length && currentHeight + h > availableHeight) flush();
    current.push(fb);
    currentHeight += h;
  });
  flush();

  return pages.length ? pages : [[]];
}

export function buildLessonPages(flat: FlatBlock[], heights: number[], availableHeight: number): DynamicPage[] {
  const packed = packBlocks(flat, heights, availableHeight);
  return [{ kind: 'cover' }, ...packed.map(items => ({ kind: 'content' as const, items }))];
}
