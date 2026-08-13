---
name: react-pageflip mobile single-page mode
description: How to reliably configure react-pageflip for single-page on mobile, two-page spread on desktop, with position preservation across breakpoint changes.
---

## The rule

Use the **container's clientWidth** (via ResizeObserver), not `window.innerWidth`, to decide `isPortrait`.
Pass `key={isPortrait ? 'portrait' : 'landscape'}` to HTMLFlipBook — this forces a full StPageFlip remount when the mode changes; without it the library's internal state stays wrong.

**Why:** `usePortrait` prop alone does NOT reliably switch StPageFlip between 1-page and 2-page modes after initial mount. The only reliable fix is remounting via `key`.

**How to apply:**

1. Compute `portrait = containerEl.clientWidth < 768` inside a ResizeObserver callback.
2. Store in `isPortrait` state (batched with `dims` state so they update together).
3. `<HTMLFlipBook key={isPortrait ? 'portrait' : 'landscape'} usePortrait={isPortrait} ...>`
4. Use `savedPageRef = useRef(0)` in the parent (persists across remounts), update on `onFlip`, pass as `startPage={savedPageRef.current}` to restore reading position after remount.
5. Set `disableFlipByClick={true}` if you have custom tap zones to prevent double-firing.
6. Set `drawShadow={!isPortrait}` and `showPageCorners={!isPortrait}` — disabling these in portrait removes two-page-spread visual artefacts on mobile.

## Key dimension distinction

- `width` prop = ONE page's width in both portrait and landscape modes.
- In landscape (desktop): total book width rendered = `width × 2`.
- In portrait (mobile): total book width rendered = `width` (single page).
- Never set `width = containerWidth / 2` for mobile — that gives a tiny page.
