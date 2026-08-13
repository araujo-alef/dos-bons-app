/**
 * BookTransitionOverlay — cinematic transition from the Home book card
 * into the BookReader.
 *
 * Phase timeline (total ≈ 1050ms):
 *   Phase 0 — snap: book rendered at card rect, overlay invisible
 *   Phase 1 (0→400ms)  — book moves to viewport centre, overlay darkens
 *   Phase 2 (420→640ms)— slight rotateY suggestion of "opening"
 *   Navigate at 600ms  — route changes; Chapter mounts behind overlay
 *   Phase 3 (640→1050ms)— book fades out, overlay fades out, reveal Chapter
 *
 * prefers-reduced-motion: skip straight to navigation, no animation.
 */
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import bookImg from '@/assets/book-3d-v3.png';
import { useBookTransition } from '@/context/BookTransitionContext';

type Phase = 0 | 1 | 2 | 3;

export function BookTransitionOverlay() {
  const { transition, clearTransition } = useBookTransition();
  const [, setLocation] = useLocation();
  const [phase, setPhase] = useState<Phase>(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const rafRef = useRef<number | null>(null);

  function killTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
  }

  function at(fn: () => void, ms: number) {
    timers.current.push(setTimeout(fn, ms));
  }

  useEffect(() => {
    if (!transition) { setPhase(0); return; }

    const prefersReduced =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      setLocation(transition.targetPath);
      clearTransition();
      return;
    }

    setPhase(0);
    killTimers();

    // Double-rAF so the phase-0 render commits before transitions start
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => {
        setPhase(1);                                       // book → centre
        at(() => setPhase(2), 420);                        // rotateY hint
        at(() => { setLocation(transition.targetPath); setPhase(3); }, 600);
        at(() => clearTransition(), 1060);
      });
    });

    return killTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transition?.targetPath]);

  if (!transition) return null;

  /* ── Computed geometry ─────────────────────────────────────────────────── */
  const { bookRect } = transition;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Target width = 72% of viewport, capped at 310px (one page in portrait)
  const targetW  = Math.min(vw * 0.72, 310);
  const scale    = targetW / bookRect.width;
  const dx       = (vw - bookRect.width  * scale) / 2 - bookRect.left;
  const dy       = (vh - bookRect.height * scale) / 2 - bookRect.top;

  /* ── Derived styles per phase ──────────────────────────────────────────── */

  // Outer div: handles translate + uniform scale (no rotation here)
  const outerTransform  = phase >= 1
    ? `translate(${dx}px, ${dy}px) scale(${scale})`
    : 'translate(0px, 0px) scale(1)';
  const outerTransition = phase === 1
    ? 'transform 400ms cubic-bezier(0.22, 1, 0.36, 1)'
    : 'none';

  // Inner div: handles rotateY + opacity (separate element = no transform conflict)
  const innerTransform  = phase >= 2
    ? 'perspective(900px) rotateY(5deg)'
    : 'perspective(900px) rotateY(0deg)';
  const innerOpacity    = phase >= 3 ? 0 : 1;
  const innerTransition = phase >= 3
    ? 'transform 240ms ease-in-out, opacity 380ms ease-out'
    : phase === 2
    ? 'transform 220ms ease-in-out'
    : 'none';

  // Dark overlay
  const bgOpacity    = phase >= 3 ? 0 : phase >= 1 ? 0.94 : 0;
  const bgTransition = phase >= 3
    ? 'opacity 460ms ease-out 120ms'
    : phase === 1
    ? 'opacity 360ms ease-out'
    : 'none';

  // Purple energy glow — peaks at phase 2
  const glowOpacity = phase === 2 ? 0.72 : 0;

  return (
    <>
      {/* ── Dark overlay ──────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position:   'fixed',
          inset:       0,
          background: '#050505',
          opacity:     bgOpacity,
          transition:  bgTransition,
          zIndex:      9990,
          // Block interaction with the page below during active phases
          pointerEvents: phase >= 1 && phase < 3 ? 'all' : 'none',
        }}
      />

      {/* ── Purple energy glow (peaks at phase 2) ─────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position:   'fixed',
          inset:       0,
          background:
            'radial-gradient(ellipse 65% 48% at 50% 50%, rgba(178,102,255,0.30) 0%, transparent 68%)',
          filter:     'blur(18px)',
          opacity:     glowOpacity,
          transition: 'opacity 280ms ease-out',
          zIndex:      9991,
          pointerEvents: 'none',
        }}
      />

      {/* ── Animated book ─────────────────────────────────────────────── */}
      {/*   Outer div: translate + scale                                    */}
      {/*   Inner div: rotateY + opacity fade                               */}
      <div
        aria-hidden="true"
        style={{
          position:        'fixed',
          top:              bookRect.top,
          left:             bookRect.left,
          width:            bookRect.width,
          height:           bookRect.height,
          transform:        outerTransform,
          transition:       outerTransition,
          transformOrigin: 'top left',
          zIndex:           9999,
          pointerEvents:   'none',
          willChange:      'transform',
        }}
      >
        <div
          style={{
            width:      '100%',
            height:     '100%',
            transform:   innerTransform,
            transition:  innerTransition,
            opacity:     innerOpacity,
            willChange: 'transform, opacity',
          }}
        >
          <img
            src={bookImg}
            alt=""
            style={{
              width:           '100%',
              height:          '100%',
              objectFit:       'contain',
              objectPosition:  'center center',
              display:         'block',
            }}
          />
        </div>
      </div>
    </>
  );
}
