/**
 * DOM ↔ character-offset conversion for the highlight system.
 * A highlight is addressed as (blockIdx, startOffset, endOffset) — a plain
 * character range over blockEl.textContent — never as a live Range/Selection,
 * so it can be persisted and reconstructed on any future render.
 */

export function findAncestorWithAttr(node: Node, attr: string): Element | null {
  let cur: Node | null = node;
  while (cur) {
    if (cur instanceof Element && cur.hasAttribute(attr)) return cur;
    cur = cur.parentNode;
  }
  return null;
}

/**
 * Returns the character offset of (node, offset) measured from the start of
 * blockEl's text content. Works whether node is a Text node or an Element
 * (browsers sometimes return an Element + child-index as a range endpoint,
 * e.g. when the selection ends at a line boundary).
 */
export function getOffsetInBlock(node: Node, offset: number, blockEl: Element): number {
  try {
    const pre = document.createRange();
    pre.selectNodeContents(blockEl);
    pre.setEnd(node, offset);
    return pre.toString().length;
  } catch {
    return -1;
  }
}

/**
 * Inverse of getOffsetInBlock: given a character offset relative to
 * blockEl's text content, returns the (text node, node-local offset) pair
 * that points there. Walks all descendant text nodes (marks included —
 * their content is part of the same running text), so it's consistent with
 * how <HighlightedText> slices the string regardless of existing <mark>s.
 */
export function getNodeOffsetForBlockOffset(
  blockEl: Element,
  charOffset: number,
): { node: Text; offset: number } | null {
  const walker = document.createTreeWalker(blockEl, NodeFilter.SHOW_TEXT);
  let remaining = charOffset;
  let node: Node | null;
  let last: Text | null = null;
  while ((node = walker.nextNode())) {
    const text = node as Text;
    last = text;
    const len = text.data.length;
    if (remaining <= len) return { node: text, offset: Math.max(0, remaining) };
    remaining -= len;
  }
  // Offset beyond the block's total length — clamp to the very end.
  return last ? { node: last, offset: last.data.length } : null;
}

/**
 * Finds the character offset within blockEl nearest to viewport point (x,y),
 * using pure text geometry instead of the browser's caret-from-point APIs.
 *
 * On at least one real device tested, document.caretRangeFromPoint /
 * caretPositionFromPoint ignored pointer-events:none and resolved to
 * whatever non-interactive overlay (watermark, debug HUD) happened to be
 * painted on top, rather than drilling through to the real text below —
 * making them unusable for this app's layout, which always has such
 * overlays above the reading content. This works around that entirely: we
 * already know which block we're in (found via elementFromPoint, which DOES
 * respect pointer-events correctly), so we just measure where each
 * character actually renders and pick the nearest one — no hit-testing
 * involved at all.
 */
export function offsetAtPoint(blockEl: Element, x: number, y: number): number {
  const len = blockEl.textContent?.length ?? 0;
  if (len === 0) return 0;

  const range = document.createRange();
  let best = 0;
  let bestDist = Infinity;

  // Sample every character; blocks here are short (a page of body text),
  // so this is a few hundred cheap Range measurements at most.
  for (let i = 0; i <= len; i++) {
    const point = getNodeOffsetForBlockOffset(blockEl, i);
    if (!point) continue;
    try {
      range.setStart(point.node, point.offset);
      range.collapse(true);
    } catch {
      continue;
    }
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0 && rect.top === 0 && rect.left === 0) continue;

    const cx = rect.left;
    const cy = rect.top + rect.height / 2;
    // Weight vertical distance heavily so we lock onto the correct line
    // first, then pick the nearest column within it.
    const dist = Math.abs(cy - y) * 1000 + Math.abs(cx - x);
    if (dist < bestDist) { bestDist = dist; best = i; }
  }

  return best;
}
