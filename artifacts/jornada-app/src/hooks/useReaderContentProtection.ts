import { useEffect, type RefObject } from 'react';

/**
 * Attaches copy-protection event listeners to the BookReader container.
 *
 * Blocks:
 *  - text selection via CSS is handled at the component level (user-select: none)
 *  - copy / cut events
 *  - context menu (right-click)
 *  - dragstart (prevent dragging text/images out)
 *  - Ctrl/Cmd + C keyboard shortcut (document-level, active while reader is mounted)
 *
 * Does NOT block pointer events, swipe, or any navigation gestures.
 * All listeners are cleaned up on unmount.
 */
export function useReaderContentProtection(
  containerRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prevent = (e: Event) => e.preventDefault();

    const preventKeyboardCopy = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
      }
    };

    // Scoped to the reader container
    container.addEventListener('copy',        prevent);
    container.addEventListener('cut',         prevent);
    container.addEventListener('contextmenu', prevent);
    container.addEventListener('dragstart',   prevent);

    // Document-level: active while reader is mounted (reader is full-screen when open)
    document.addEventListener('keydown', preventKeyboardCopy);

    return () => {
      container.removeEventListener('copy',        prevent);
      container.removeEventListener('cut',         prevent);
      container.removeEventListener('contextmenu', prevent);
      container.removeEventListener('dragstart',   prevent);
      document.removeEventListener('keydown', preventKeyboardCopy);
    };
  }, [containerRef]);
}
