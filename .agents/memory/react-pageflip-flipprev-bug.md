---
name: react-pageflip flipPrev bug with disableFlipByClick
description: flipPrev silently aborts when disableFlipByClick=true — cause and workaround
---

## The bug

`flipPrev` in react-pageflip v2.0.3 (StPageFlip) silently does nothing when `disableFlipByClick={true}`.

**Why:** `flipPrev(corner)` calls `this.flip({ x: 10, y: ... })` internally.
`flip()` checks `isPointOnCorners(t)` when `disableFlipByClick=true`.
That function converts `x=10` via `convertToBook` → `bookX = 10 - rect.left`.
In portrait mode `rect.left = -pageWidth`, so `bookX = pageWidth + 10` (~380 on mobile).
This lands in the middle of the book, NOT in a corner region, so `isPointOnCorners` returns `false` and `flip()` returns early.

`flipNext` is unaffected because its starting x (`rect.left + 2*pageWidth - 10`) converts to `2*pageWidth - 10`, which IS in the right-corner zone.

**How to apply:** Whenever using `disableFlipByClick={true}` with programmatic `flipPrev`, apply this workaround:

```tsx
const pf = bookRef.current?.pageFlip?.();
const settings = pf?.getSettings?.();
if (settings) settings.disableFlipByClick = false;
pf?.flipPrev('top');           // 'top' is the correct corner for portrait backward flip
if (settings) settings.disableFlipByClick = true;
```

The `disableFlipByClick` check is synchronous inside `flip()`; the animation is async, so
restoring the flag immediately after the call is safe.

**Also:** Never call `flipNext()` or `flipPrev()` without the corner argument — it is
required (not optional) in the JS build even though the TypeScript types mark it optional.
`flipNext('bottom')` and `flipPrev('top')` are the correct calls for portrait mode forward/back.

**Also:** Do NOT call `setCurrentPage()` state update before calling flip — it triggers
a React re-render mid-animation that corrupts StPageFlip's internal state and breaks the
animation visually. Update only the ref before the call; sync state in `onFlip` / `onChangeState`.
