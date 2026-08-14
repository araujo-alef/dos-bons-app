import type { BookHighlight } from '@/lib/highlights';

interface HighlightedTextProps {
  text: string;
  /** Highlights that belong to this specific block */
  blockHighlights: BookHighlight[];
  pulsingId?: string | null;
}

/**
 * Renders plain text with inline mark spans for each saved highlight.
 * Handles overlapping ranges by merging them before rendering.
 */
export function HighlightedText({ text, blockHighlights, pulsingId }: HighlightedTextProps) {
  if (blockHighlights.length === 0) return <>{text}</>;

  // Sort by start and merge overlapping/adjacent ranges
  type Segment = { start: number; end: number; ids: string[] };
  const sorted = [...blockHighlights]
    .filter(h => h.startOffset < h.endOffset)
    .sort((a, b) => a.startOffset - b.startOffset);

  const merged: Segment[] = [];
  for (const h of sorted) {
    const last = merged[merged.length - 1];
    if (last && h.startOffset <= last.end) {
      last.end = Math.max(last.end, h.endOffset);
      last.ids.push(h.id);
    } else {
      merged.push({ start: h.startOffset, end: h.endOffset, ids: [h.id] });
    }
  }

  const parts: React.ReactNode[] = [];
  let cursor = 0;

  for (const seg of merged) {
    const start = Math.max(cursor, seg.start);
    const end   = Math.min(text.length, seg.end);
    if (start >= end) continue;

    if (cursor < start) parts.push(text.slice(cursor, start));

    const isPulsing = seg.ids.includes(pulsingId ?? '');
    parts.push(
      <mark
        key={seg.ids[0]}
        data-highlight-ids={seg.ids.join(',')}
        style={{
          background:  isPulsing ? 'rgba(178,102,255,0.38)' : 'rgba(178,102,255,0.18)',
          color:       'inherit',
          borderRadius: '2px',
          padding:     '0 1px',
          transition:  'background 0.8s ease',
        }}
      >
        {text.slice(start, end)}
      </mark>
    );
    cursor = end;
  }

  if (cursor < text.length) parts.push(text.slice(cursor));

  return <>{parts}</>;
}
