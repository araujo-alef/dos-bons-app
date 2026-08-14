/**
 * BookTransitionOverlay — cinematic Home → Reader transition
 *
 * Architecture:
 *   - Rendered into document.body via createPortal (avoids stacking / overflow issues)
 *   - Phase-based state machine — single source of truth for the animation
 *   - Framer Motion useAnimationControls + await chains phases, no scattered setTimeouts
 *   - Single shell anchored at the book-image DOMRect; all movement via x/y/scale transforms
 *
 * Phase timeline  (total ≈ 2 s):
 *   idle           — not visible
 *   launching      0–650 ms   shell flies along a curved 4-keyframe path to center
 *   centering      650–760ms  short stabilisation pause
 *   crossfading    760–880ms  PNG → OpeningBookStage crossfade (120ms)
 *   opening        880–1280ms cover rotates open (rotateY 0 → -105°)
 *   flippingBack   1080–1600ms pages stagger-flip back (overlaps opening)
 *   zooming        1600–1900ms shell expands to fill viewport
 *   revealingReader 1900ms    navigate + shell fades to 0
 *   complete       clearTransition
 *
 * Chapter.tsx reads sessionStorage 'bookEntryTransition' and renders a cream
 * bridge overlay that fades out on mount, hiding the handoff seam.
 */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'wouter';
import { motion, useAnimationControls } from 'framer-motion';
import bookImg from '@/assets/book-3d-v3.png';
import { useBookTransition } from '@/context/BookTransitionContext';

/* ─── Phase type ─────────────────────────────────────────────────────────── */
type Phase =
  | 'idle'
  | 'launching'
  | 'centering'
  | 'crossfading'
  | 'opening'
  | 'flippingBack'
  | 'zooming'
  | 'revealingReader'
  | 'complete';

const NUM_FLIP_PAGES = 6;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/* ─── FlipPage ───────────────────────────────────────────────────────────── */
const PAGE_BG = [
  'linear-gradient(to right, #d5ccb6, #e4dbca)',
  'linear-gradient(to right, #dbd2bc, #e9e0ce)',
  'linear-gradient(to right, #dfd6c0, #ece3d2)',
  'linear-gradient(to right, #e2d9c3, #eee5d5)',
  'linear-gradient(to right, #e5dcc6, #f0e7d7)',
  'linear-gradient(to right, #e8e0cb, #f2e9da)',
];

function FlipPage({ index, phase }: { index: number; phase: Phase }) {
  const isFlipping = ['flippingBack', 'zooming', 'revealingReader', 'complete'].includes(phase);
  const isVisible  = ['opening', 'flippingBack', 'zooming', 'revealingReader', 'complete'].includes(phase);

  return (
    <motion.div
      initial={{ rotateY: 0, opacity: 0 }}
      animate={{
        rotateY: isFlipping ? -160 : 0,
        opacity:  isVisible  ? 1 : 0,
      }}
      transition={{
        rotateY: {
          duration: 0.22,
          delay:    isFlipping ? index * 0.045 : 0,
          ease:     'easeInOut',
        },
        opacity: { duration: 0.08 },
      }}
      style={{
        position:       'absolute',
        inset:          0,
        transformOrigin: 'left center',
        transformStyle: 'preserve-3d',
        borderRadius:   '2px 5px 5px 2px',
        zIndex:          NUM_FLIP_PAGES - index,
      }}
    >
      {/* Front face */}
      <div
        style={{
          position:          'absolute',
          inset:             0,
          background:        PAGE_BG[index],
          borderRadius:      'inherit',
          backfaceVisibility: 'hidden',
          overflow:          'hidden',
        }}
      >
        {/* Editorial lines */}
        <div
          style={{
            position:      'absolute',
            inset:         '12% 16%',
            display:       'flex',
            flexDirection: 'column',
            gap:           '9%',
            opacity:       0.1,
          }}
        >
          {[100, 100, 100, 60, 85].map((w, j) => (
            <div
              key={j}
              style={{
                height:      '4%',
                background:  '#251508',
                borderRadius: 2,
                width:       `${w}%`,
              }}
            />
          ))}
        </div>
        {/* Page number */}
        <div
          style={{
            position:   'absolute',
            bottom:     '6%',
            right:      '8%',
            fontSize:   '6px',
            color:      'rgba(37,21,8,0.22)',
            fontFamily: 'serif',
          }}
        >
          {index + 1}
        </div>
        {/* Spine shadow */}
        <div
          style={{
            position:   'absolute',
            top: 0, bottom: 0, left: 0,
            width:      '14%',
            background: 'linear-gradient(to right, rgba(0,0,0,0.14), transparent)',
          }}
        />
      </div>

      {/* Back face */}
      <div
        style={{
          position:          'absolute',
          inset:             0,
          background:        '#ddd4be',
          transform:         'rotateY(180deg)',
          backfaceVisibility: 'hidden',
          borderRadius:      'inherit',
        }}
      />
    </motion.div>
  );
}

/* ─── Core shell ─────────────────────────────────────────────────────────── */
function BookTransitionShell() {
  const { transition, clearTransition } = useBookTransition();
  const [, setLocation] = useLocation();
  const [phase, setPhase] = useState<Phase>('idle');

  const shellControls   = useAnimationControls();
  const overlayControls = useAnimationControls();
  const pngControls     = useAnimationControls();
  const stageControls   = useAnimationControls();
  const coverControls   = useAnimationControls();

  useEffect(() => {
    if (!transition) { setPhase('idle'); return; }

    /* ── Reduced-motion fallback ─────────────────────────────────────────── */
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      sessionStorage.setItem('bookEntryTransition', '1');
      setLocation(transition.targetPath);
      clearTransition();
      return;
    }

    const { bookRect } = transition;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    /* ── Geometry ────────────────────────────────────────────────────────── */
    // Centered target (book fills ~75% of narrow dimension, max 320px)
    const targetW     = Math.min(vw * 0.75, 320);
    const targetScale = targetW / bookRect.width;

    // translateX/Y that place the top-left corner of the scaled shell at center
    const centerX = (vw - bookRect.width  * targetScale) / 2 - bookRect.left;
    const centerY = (vh - bookRect.height * targetScale) / 2 - bookRect.top;

    // Full-viewport expansion
    const finalScale = Math.max(vw / bookRect.width, vh / bookRect.height);
    const expandX    = (vw - bookRect.width  * finalScale) / 2 - bookRect.left;
    const expandY    = (vh - bookRect.height * finalScale) / 2 - bookRect.top;

    // Organic curve parameters
    const dip = bookRect.height * 0.28; // drops down before rising

    let cancelled = false;

    async function run() {
      try {
        /* ── Launching (0–650ms) ─────────────────────────────────────────── */
        setPhase('launching');

        await Promise.all([
          shellControls.start({
            x:       [0, bookRect.width * 0.07, centerX - 30, centerX],
            y:       [0, dip, centerY + 40, centerY],
            scale:   [1, 1.06, targetScale * 1.07, targetScale],
            rotateZ: [-2, 1.5, -0.5, 0],
            rotateY: [-8, 4, -2, 0],
            rotateX: [2, -1, 0, 0],
            transition: {
              duration: 0.65,
              times:    [0, 0.35, 0.72, 1],
              ease:     [
                [0.33, 1, 0.68, 1],
                [0.22, 1, 0.36, 1],
                [0.16, 1, 0.3,  1],
              ],
            },
          }),
          overlayControls.start({
            opacity:    0.93,
            transition: { duration: 0.45, ease: 'easeOut' },
          }),
        ]);
        if (cancelled) return;

        /* ── Centering — stabilisation pause (110ms) ─────────────────────── */
        setPhase('centering');
        await sleep(110);
        if (cancelled) return;

        /* ── Crossfading PNG → Stage (120ms) ─────────────────────────────── */
        setPhase('crossfading');
        await Promise.all([
          pngControls.start({ opacity: 0, transition: { duration: 0.12, ease: 'easeOut' } }),
          stageControls.start({ opacity: 1, transition: { duration: 0.12, ease: 'easeIn'  } }),
        ]);
        if (cancelled) return;

        /* ── Opening — cover swings open, NOT awaited (overlaps flip) ──────── */
        setPhase('opening');
        coverControls.start({
          rotateY:    -105,
          transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
        });
        await sleep(200); // 200ms into opening, start flip
        if (cancelled) return;

        /* ── FlippingBack — stagger driven by phase state (520ms) ─────────── */
        setPhase('flippingBack');
        // 6 pages × 45ms stagger + 220ms last flip ≈ 490ms; add 30ms buffer
        await sleep(520);
        if (cancelled) return;

        /* ── Zooming — shell expands to fill viewport (300ms) ────────────── */
        setPhase('zooming');
        await Promise.all([
          shellControls.start({
            x:          expandX,
            y:          expandY,
            scale:      finalScale,
            transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
          }),
          overlayControls.start({
            opacity:    0,
            transition: { duration: 0.25, ease: 'easeOut' },
          }),
        ]);
        if (cancelled) return;

        /* ── RevealingReader — navigate then fade shell (150ms) ─────────── */
        setPhase('revealingReader');
        sessionStorage.setItem('bookEntryTransition', '1');
        setLocation(transition.targetPath);

        await shellControls.start({
          opacity:    0,
          transition: { duration: 0.15, ease: 'easeOut' },
        });
        if (cancelled) return;

        setPhase('complete');
        clearTransition();
      } catch {
        // Safety fallback — never block navigation
        if (!cancelled) {
          sessionStorage.setItem('bookEntryTransition', '1');
          setLocation(transition.targetPath);
          clearTransition();
        }
      }
    }

    run();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transition?.targetPath]);

  if (!transition || phase === 'idle' || phase === 'complete') return null;

  const { bookRect } = transition;

  const proxyVisible = ['flippingBack', 'zooming', 'revealingReader', 'complete'].includes(phase);
  const glowVisible  = ['crossfading', 'opening', 'flippingBack'].includes(phase);
  const isBlocking   = phase !== 'idle' && phase !== 'complete';

  return createPortal(
    <div
      aria-hidden="true"
      style={{
        position:      'fixed',
        inset:         0,
        zIndex:        9980,
        pointerEvents: isBlocking ? 'all' : 'none',
      }}
    >
      {/* ── Dark overlay ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={overlayControls}
        style={{
          position: 'fixed',
          inset:    0,
          background: '#050505',
          zIndex:   1,
        }}
      />

      {/* ── Ambient glow ──────────────────────────────────────────────────── */}
      <div
        style={{
          position:   'fixed',
          inset:      0,
          background: 'radial-gradient(ellipse 60% 44% at 50% 50%, rgba(178,102,255,0.32) 0%, transparent 68%)',
          filter:     'blur(18px)',
          opacity:     glowVisible ? 0.6 : 0,
          transition: 'opacity 300ms ease-out',
          zIndex:     2,
          pointerEvents: 'none',
        }}
      />

      {/* ── Single shell — anchored at book-image rect ─────────────────────
          All movement is via x / y / scale transforms from this anchor.
          transformOrigin: top left  →  centering formula accounts for scale. */}
      <motion.div
        initial={{ x: 0, y: 0, scale: 1, rotateZ: 0, rotateY: 0, rotateX: 0, opacity: 1 }}
        animate={shellControls}
        style={{
          position:        'fixed',
          top:              bookRect.top,
          left:             bookRect.left,
          width:            bookRect.width,
          height:           bookRect.height,
          transformOrigin: 'top left',
          zIndex:          10,
          pointerEvents:   'none',
          willChange:      'transform',
        }}
      >
        {/* PNG — pixel-perfect over the card book image; fades out in crossfade */}
        <motion.img
          src={bookImg}
          alt=""
          initial={{ opacity: 1 }}
          animate={pngControls}
          style={{
            position:   'absolute',
            inset:      0,
            width:      '100%',
            height:     '100%',
            objectFit:  'fill',
            display:    'block',
          }}
        />

        {/* ── Opening stage — pre-mounted at opacity 0 ────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={stageControls}
          style={{
            position:    'absolute',
            inset:       0,
            perspective: '1200px',
          }}
        >
          {/* Dark book body / spine */}
          <div
            style={{
              position:     'absolute',
              inset:        0,
              background:   '#0d0b09',
              borderRadius: '3px 6px 6px 3px',
              boxShadow:    '6px 0 20px rgba(0,0,0,0.7)',
            }}
          />

          {/* Cream proxy page — becomes visible from flippingBack onwards;
              the shell zoom makes this fill the viewport in the zoom phase. */}
          <div
            style={{
              position:     'absolute',
              inset:        0,
              background:   'linear-gradient(150deg, #f2e9d4 0%, #ece0c4 100%)',
              borderRadius: '2px 5px 5px 2px',
              opacity:       proxyVisible ? 1 : 0,
              transition:   'opacity 80ms ease-in',
              zIndex:       0,
            }}
          />

          {/* Flip pages — stagger triggered when phase hits flippingBack */}
          {Array.from({ length: NUM_FLIP_PAGES }).map((_, i) => (
            <FlipPage key={i} index={i} phase={phase} />
          ))}

          {/* Cover — rotates open with rotateY; sits above pages in DOM */}
          <motion.div
            initial={{ rotateY: 0 }}
            animate={coverControls}
            style={{
              position:        'absolute',
              inset:           0,
              transformStyle:  'preserve-3d',
              transformOrigin: 'left center',
              zIndex:          NUM_FLIP_PAGES + 1,
            }}
          >
            {/* Front face */}
            <div
              style={{
                position:          'absolute',
                inset:             0,
                backfaceVisibility: 'hidden',
                borderRadius:      '3px 6px 6px 3px',
                overflow:          'hidden',
              }}
            >
              <img
                src={bookImg}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block' }}
              />
            </div>
            {/* Back face */}
            <div
              style={{
                position:          'absolute',
                inset:             0,
                background:        '#181210',
                backfaceVisibility: 'hidden',
                transform:         'rotateY(180deg)',
                borderRadius:      '3px 6px 6px 3px',
              }}
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </div>,
    document.body,
  );
}

/* ─── Public export ──────────────────────────────────────────────────────── */
export function BookTransitionOverlay() {
  return <BookTransitionShell />;
}
