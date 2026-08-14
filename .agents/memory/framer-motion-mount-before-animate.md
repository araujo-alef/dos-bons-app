---
name: Framer Motion — mount before animate
description: controls.start() resolves immediately if the animated element isn't mounted yet; all phases fire at once at the initial position.
---

## Rule
Never call `controls.start()` before the `motion.div` it targets is in the DOM.

## Why
`useAnimationControls.start()` resolves as a no-op (returns immediately) when the target element is not yet mounted. If the animation shell returns `null` in the idle phase and the effect calls `controls.start()` before the first render with the shell visible, every `await controls.start(...)` resolves instantly — all phases fire together and no movement occurs.

**Symptom:** animation plays "inside the card" / all phases happen at card position simultaneously.

## How to apply
1. Do **not** return `null` when `phase === 'idle'` if `transition` is set. Render the shell (possibly with opacity 0 or at card position) so it is in the DOM.
2. Gate the early return on `if (!transition) return null` only.
3. Use `useLayoutEffect` + **double-rAF** to start the animation sequence, guaranteeing the shell has painted before any `controls.start()` call:

```tsx
useLayoutEffect(() => {
  if (!transition) return;
  let raf1 = requestAnimationFrame(() => {
    let raf2 = requestAnimationFrame(() => { run(); });
    return () => cancelAnimationFrame(raf2);
  });
  return () => cancelAnimationFrame(raf1);
}, [transition?.targetPath]);
```

4. Keep a `cancelledRef` flag and check it after every `await` to handle unmount during animation.
