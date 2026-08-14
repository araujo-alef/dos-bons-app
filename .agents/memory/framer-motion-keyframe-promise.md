---
name: Framer Motion keyframe promise hang
description: controls.start() with complex keyframe arrays (times + cubic-bezier ease arrays) may never resolve its promise, hanging Promise.all indefinitely.
---

## Rule
Never `await controls.start()` (or `Promise.all([controls.start(...)])`) when the transition uses ALL of:
- multi-property keyframe arrays
- `times` array
- `ease` as an array of cubic-bezier tuples

The promise silently never resolves, blocking the entire phase state machine.

**Why:** Framer Motion's internal animation completion callback is not reliably fired for this combination of options. The bug is reproducible at durations ≥ 1s; shorter durations sometimes mask it.

**How to apply:**
Fire `.start()` calls without awaiting them, then manually `await sleep(durationMs)` for the longest animation's duration:

```ts
shellCtrl.start({ x: [...], transition: { duration: 1.4, times: [...], ease: [[...], ...] } });
bookRotCtrl.start({ rotateY: [...], transition: { duration: 1.4, times: [...], ease: [[...], ...] } });
overlayCtrl.start({ opacity: 0.85, transition: { duration: 0.6 } });
await sleep(1400); // manual sync — do not rely on promise resolution
```

Simple single-property animations (`controls.start({ opacity: 0, transition: { duration: 0.15 } })`) resolve fine and can still be awaited normally.
