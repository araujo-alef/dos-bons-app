import { useEffect, useState } from 'react';
import { getNodeOffsetForBlockOffset } from '@/lib/textOffset';

/** One paragraph's slice of an in-progress selection. */
export interface LiveSelectionPart {
  block: Element;
  start: number;
  end:   number;
}

interface TouchSelectionOverlayProps {
  parts: LiveSelectionPart[];
}

/**
 * Paints the live "in-progress" highlight while the user drags a finger
 * over text — purely visual, built from our own tracked character ranges
 * (see the touch-selection effect in BookReader). Never touches
 * window.getSelection(), so there's no native gesture for iOS to lose track
 * of mid-drag; this can re-render on every touchmove with no risk.
 *
 * Takes a list of parts because a selection may span several paragraphs,
 * each a separate block element with its own character range.
 */
export function TouchSelectionOverlay({ parts }: TouchSelectionOverlayProps) {
  const [rects, setRects] = useState<DOMRect[]>([]);

  // Parts is a fresh array each render, so depend on a stable signature of
  // its contents instead — otherwise this re-measures on every render.
  const signature = parts.map(p => `${p.start}:${p.end}`).join('|');

  useEffect(() => {
    const collected: DOMRect[] = [];
    for (const part of parts) {
      const startPoint = getNodeOffsetForBlockOffset(part.block, part.start);
      const endPoint   = getNodeOffsetForBlockOffset(part.block, part.end);
      if (!startPoint || !endPoint) continue;
      try {
        const range = document.createRange();
        range.setStart(startPoint.node, startPoint.offset);
        range.setEnd(endPoint.node, endPoint.offset);
        collected.push(...Array.from(range.getClientRects()));
      } catch {
        /* skip this part */
      }
    }
    setRects(collected);
  }, [signature]);

  if (rects.length === 0) return null;

  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 140, pointerEvents: 'none' }}>
      {rects.map((r, i) => (
        <div
          key={i}
          style={{
            position:     'fixed',
            top:          r.top,
            left:         r.left,
            width:        r.width,
            height:       r.height,
            background:   'rgba(178,102,255,0.34)',
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}
