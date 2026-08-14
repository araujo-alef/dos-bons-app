/**
 * BookTransitionOverlay — cinematic Home → Reader transition
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ARCHITECTURE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  createPortal → document.body
 *    └─ outer fixed wrapper (perspective 1200px for 3D tilt during launch)
 *         ├─ dark overlay            (fades in during launch)
 *         ├─ ambient glow            (visible during opening/flip phases)
 *         └─ BookTransitionShell     (position:fixed at bookRect, animated via x/y/scale)
 *              ├─ ClosedBookVisual   (PNG, fades out in crossfade)
 *              └─ OpeningBookStage   (perspective, pre-mounted at opacity 0)
 *                   ├─ dark book body
 *                   ├─ cream proxy page  (visible from flippingBack onwards)
 *                   ├─ FlipPage × 6     (stagger-flipped in flippingBack)
 *                   └─ Cover            (rotateY 0 → -105 in opening)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * CRITICAL FIX — MOUNT-BEFORE-ANIMATE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  framer-motion resolves controls.start() immediately when the animated
 *  element is not yet mounted. If we return null in 'idle' phase, the shell
 *  is NOT in the DOM when the effect fires, so every await resolves at once
 *  and all phases fire together at card position.
 *
 *  Fix: when `transition` is set, we ALWAYS render the shell (even in idle).
 *  The shell is pixel-perfect over the card book image. A double-rAF inside
 *  useLayoutEffect guarantees the shell has painted before we call
 *  controls.start(), so every animation runs as expected.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE TIMELINE  (total ≈ 2.2 s)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *   idle           shell at card pos, PNG visible — waits for paint
 *   detaching      0–40ms    1-2 frame pause to confirm shell is on screen
 *   launching      40–740ms  curved path: x/y/scale/rotateZ/rotateY keyframes
 *   centering      740–860ms stabilisation pause (book arrived, no movement)
 *   crossfading    860–980ms PNG → OpeningBookStage crossfade (120ms)
 *   opening        980–1380ms cover rotateY 0 → -105° (400ms)
 *   flippingBack   1180–1700ms pages stagger-flip (overlaps tail of opening)
 *   zooming        1700–2000ms shell scale to fill viewport (300ms)
 *   revealingReader 2000ms   navigate + shell opacity 0 (150ms)
 *   complete       clearTransition
 */

import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'wouter';
import { motion, useAnimationControls } from 'framer-motion';
import bookImg from '@/assets/book-3d-v3.png';
import { useBookTransition } from '@/context/BookTransitionContext';

/* ─── Phase ──────────────────────────────────────────────────────────────── */
type Phase =
  | 'idle'
  | 'detaching'
  | 'launching'
  | 'centering'
  | 'crossfading'
  | 'opening'
  | 'flippingBack'
  | 'zooming'
  | 'revealingReader'
  | 'complete';

const NUM_FLIP = 6;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/* ─── FlipPage ───────────────────────────────────────────────────────────── */
const PAGE_BG = [
  'linear-gradient(to right,#d5ccb6,#e4dbca)',
  'linear-gradient(to right,#dbd2bc,#e9e0ce)',
  'linear-gradient(to right,#dfd6c0,#ece3d2)',
  'linear-gradient(to right,#e2d9c3,#eee5d5)',
  'linear-gradient(to right,#e5dcc6,#f0e7d7)',
  'linear-gradient(to right,#e8e0cb,#f2e9da)',
];

function FlipPage({ index, phase }: { index: number; phase: Phase }) {
  const flipping = ['flippingBack','zooming','revealingReader','complete'].includes(phase);
  const visible  = ['opening','flippingBack','zooming','revealingReader','complete'].includes(phase);

  return (
    <motion.div
      initial={{ rotateY: 0, opacity: 0 }}
      animate={{ rotateY: flipping ? -160 : 0, opacity: visible ? 1 : 0 }}
      transition={{
        rotateY: { duration: 0.22, delay: flipping ? index * 0.045 : 0, ease: 'easeInOut' },
        opacity: { duration: 0.08 },
      }}
      style={{
        position: 'absolute', inset: 0,
        transformOrigin: 'left center',
        transformStyle: 'preserve-3d',
        borderRadius: '2px 5px 5px 2px',
        zIndex: NUM_FLIP - index,
      }}
    >
      {/* front */}
      <div style={{
        position: 'absolute', inset: 0,
        background: PAGE_BG[index],
        borderRadius: 'inherit',
        backfaceVisibility: 'hidden',
        overflow: 'hidden',
      }}>
        <div style={{ position:'absolute', inset:'12% 16%', display:'flex', flexDirection:'column', gap:'9%', opacity:0.10 }}>
          {[100,100,100,60,85].map((w,j) => (
            <div key={j} style={{ height:'4%', background:'#251508', borderRadius:2, width:`${w}%` }} />
          ))}
        </div>
        <div style={{ position:'absolute', bottom:'6%', right:'8%', fontSize:'6px', color:'rgba(37,21,8,0.22)', fontFamily:'serif' }}>
          {index + 1}
        </div>
        <div style={{ position:'absolute', top:0, bottom:0, left:0, width:'14%', background:'linear-gradient(to right,rgba(0,0,0,0.14),transparent)' }} />
      </div>
      {/* back */}
      <div style={{ position:'absolute', inset:0, background:'#ddd4be', transform:'rotateY(180deg)', backfaceVisibility:'hidden', borderRadius:'inherit' }} />
    </motion.div>
  );
}

/* ─── Shell ──────────────────────────────────────────────────────────────── */
function BookTransitionShell() {
  const { transition, clearTransition } = useBookTransition();
  const [, setLocation] = useLocation();
  const [phase, setPhase] = useState<Phase>('idle');
  const cancelledRef = useRef(false);

  const shellCtrl   = useAnimationControls();
  const overlayCtrl = useAnimationControls();
  const pngCtrl     = useAnimationControls();
  const stageCtrl   = useAnimationControls();
  const coverCtrl   = useAnimationControls();

  // Reset phase when transition disappears
  useLayoutEffect(() => {
    if (!transition) setPhase('idle');
  }, [transition]);

  useLayoutEffect(() => {
    if (!transition) return;

    cancelledRef.current = false;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      sessionStorage.setItem('bookEntryTransition', '1');
      setLocation(transition.targetPath);
      clearTransition();
      return;
    }

    // ── Double-rAF: guarantees shell is painted before controls.start() ──
    // Without this, controls.start() resolves immediately (unmounted element)
    // and ALL phases fire simultaneously at card position.
    let raf1: number, raf2: number;

    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        run();
      });
    });

    return () => {
      cancelledRef.current = true;
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };

    async function run() {
      try {
        const { bookRect } = transition!;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        /* ── Geometry ──────────────────────────────────────────────────── */
        // Target: book center lands on viewport center, scaled to ~72% width
        const targetW     = Math.min(vw * 0.72, 310);
        const targetScale = targetW / bookRect.width;

        // With transformOrigin:'top left', translate the top-left corner so
        // the scaled book is perfectly centred:
        //   tx = vw/2 − rect.left − (rect.width  × scale)/2
        //   ty = vh/2 − rect.top  − (rect.height × scale)/2
        const tx = vw / 2 - bookRect.left - (bookRect.width  * targetScale) / 2;
        const ty = vh / 2 - bookRect.top  - (bookRect.height * targetScale) / 2;

        // Full-viewport expansion (zooming phase)
        const finalScale = Math.max(vw / bookRect.width, vh / bookRect.height);
        const expandTx   = vw / 2 - bookRect.left - (bookRect.width  * finalScale) / 2;
        const expandTy   = vh / 2 - bookRect.top  - (bookRect.height * finalScale) / 2;

        // Organic curve offsets (proportional to viewport so mobile/desktop scale)
        const dipY   = vh * 0.09;   // dip down before rising
        const swingX = vw * 0.04;   // slight lateral swing

        /* ── detaching (1–2 frames) ────────────────────────────────────── */
        setPhase('detaching');
        await sleep(40);
        if (cancelledRef.current) return;

        /* ── launching (700ms) ─────────────────────────────────────────── */
        // Curved 4-keyframe path; book flies out of the card, dips, sweeps,
        // rises to centre — all while growing and tilting.
        setPhase('launching');
        await Promise.all([
          shellCtrl.start({
            x:       [0, swingX, tx - vw * 0.04, tx],
            y:       [0, dipY,   ty + vh * 0.04, ty],
            scale:   [1, 1.06,   targetScale * 1.06, targetScale],
            rotateZ: [0, -4,     3,  0],
            rotateY: [0, -8,     5,  0],
            rotateX: [0,  2,    -1,  0],
            transition: {
              duration: 0.70,
              times:    [0, 0.33, 0.70, 1],
              ease:     [
                [0.33, 1, 0.68, 1],
                [0.22, 1, 0.36, 1],
                [0.16, 1, 0.3,  1],
              ],
            },
          }),
          overlayCtrl.start({
            opacity:    0.80,
            transition: { duration: 0.55, ease: 'easeOut' },
          }),
        ]);
        if (cancelledRef.current) return;

        /* ── centering (120ms) ─────────────────────────────────────────── */
        // Book has arrived at centre — brief pause so user registers it.
        setPhase('centering');
        await sleep(120);
        if (cancelledRef.current) return;

        /* ── crossfading PNG → OpeningBookStage (120ms) ─────────────────── */
        setPhase('crossfading');
        await Promise.all([
          pngCtrl.start({ opacity: 0, transition: { duration: 0.12, ease: 'easeOut' } }),
          stageCtrl.start({ opacity: 1, transition: { duration: 0.12, ease: 'easeIn'  } }),
        ]);
        if (cancelledRef.current) return;

        /* ── opening — cover swings open (400ms); NOT awaited so flip can overlap */
        setPhase('opening');
        coverCtrl.start({
          rotateY:    -105,
          transition: { duration: 0.40, ease: [0.22, 1, 0.36, 1] },
        });
        await sleep(200); // 200ms into opening, flip begins
        if (cancelledRef.current) return;

        /* ── flippingBack — stagger via phase state, 6 × 45ms + 220ms ── */
        setPhase('flippingBack');
        await sleep(520); // 6 × 45ms stagger + 220ms last flip ≈ 490ms
        if (cancelledRef.current) return;

        /* ── zooming — shell expands to fill viewport (300ms) ──────────── */
        setPhase('zooming');
        await Promise.all([
          shellCtrl.start({
            x: expandTx, y: expandTy, scale: finalScale,
            transition: { duration: 0.30, ease: [0.22, 1, 0.36, 1] },
          }),
          overlayCtrl.start({
            opacity:    0,
            transition: { duration: 0.25, ease: 'easeOut' },
          }),
        ]);
        if (cancelledRef.current) return;

        /* ── revealingReader — navigate then fade shell (150ms) ─────────── */
        setPhase('revealingReader');
        sessionStorage.setItem('bookEntryTransition', '1');
        setLocation(transition!.targetPath);
        await shellCtrl.start({
          opacity:    0,
          transition: { duration: 0.15, ease: 'easeOut' },
        });
        if (cancelledRef.current) return;

        setPhase('complete');
        clearTransition();
      } catch {
        // Safety net — never block navigation
        if (!cancelledRef.current) {
          sessionStorage.setItem('bookEntryTransition', '1');
          setLocation(transition!.targetPath);
          clearTransition();
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transition?.targetPath]);

  /* ── Render ────────────────────────────────────────────────────────────── */
  // IMPORTANT: do NOT return null when phase==='idle'.
  // The shell must be in the DOM when controls.start() is called.
  // We only hide the whole thing when there is no transition at all.
  if (!transition) return null;

  const { bookRect } = transition;

  const proxyVisible = ['flippingBack','zooming','revealingReader','complete'].includes(phase);
  const glowVisible  = ['crossfading','opening','flippingBack'].includes(phase);
  const blocking     = !['idle','complete'].includes(phase);

  return createPortal(
    <div
      aria-hidden="true"
      style={{
        position:      'fixed', inset: 0,
        zIndex:        9980,
        // perspective on the outer container makes rotateY on the shell look 3D
        perspective:   '1200px',
        pointerEvents: blocking ? 'all' : 'none',
      }}
    >
      {/* Dark overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={overlayCtrl}
        style={{ position: 'fixed', inset: 0, background: '#050505', zIndex: 1 }}
      />

      {/* Ambient glow */}
      <div style={{
        position:   'fixed', inset: 0,
        background: 'radial-gradient(ellipse 60% 44% at 50% 50%, rgba(178,102,255,0.32) 0%, transparent 68%)',
        filter:     'blur(18px)',
        opacity:     glowVisible ? 0.60 : 0,
        transition: 'opacity 300ms ease-out',
        zIndex:     2,
        pointerEvents: 'none',
      }} />

      {/* ── BookTransitionShell ────────────────────────────────────────────
          Anchored at the book-image DOMRect.
          ALL movement/scale/rotation happens via x, y, scale transforms.
          transformOrigin:'top left' → centering formula accounts for scale. */}
      <motion.div
        initial={{ x: 0, y: 0, scale: 1, rotateZ: 0, rotateY: 0, rotateX: 0, opacity: 1 }}
        animate={shellCtrl}
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
        {/* ── ClosedBookVisual (PNG) ───────────────────────────────────── */}
        {/* Pixel-perfect over the card's book image; fades in crossfade  */}
        <motion.img
          src={bookImg}
          alt=""
          initial={{ opacity: 1 }}
          animate={pngCtrl}
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'fill', display:'block' }}
        />

        {/* ── OpeningBookStage — pre-mounted at opacity 0 ──────────────── */}
        {/* All opening/flip animation happens here, inside the global shell */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={stageCtrl}
          style={{ position:'absolute', inset:0, perspective:'1200px' }}
        >
          {/* Dark spine / back */}
          <div style={{
            position:'absolute', inset:0,
            background:'#0d0b09',
            borderRadius:'3px 6px 6px 3px',
            boxShadow:'6px 0 20px rgba(0,0,0,0.7)',
          }} />

          {/* Cream proxy page — revealed as pages flip away */}
          <div style={{
            position:'absolute', inset:0,
            background:'linear-gradient(150deg,#f2e9d4 0%,#ece0c4 100%)',
            borderRadius:'2px 5px 5px 2px',
            opacity: proxyVisible ? 1 : 0,
            transition:'opacity 80ms ease-in',
            zIndex: 0,
          }} />

          {/* FlipPages (stagger triggered by phase) */}
          {Array.from({ length: NUM_FLIP }).map((_, i) => (
            <FlipPage key={i} index={i} phase={phase} />
          ))}

          {/* Cover — sits above pages, rotates open */}
          <motion.div
            initial={{ rotateY: 0 }}
            animate={coverCtrl}
            style={{
              position:        'absolute', inset: 0,
              transformStyle:  'preserve-3d',
              transformOrigin: 'left center',
              zIndex:          NUM_FLIP + 1,
            }}
          >
            <div style={{ position:'absolute', inset:0, backfaceVisibility:'hidden', borderRadius:'3px 6px 6px 3px', overflow:'hidden' }}>
              <img src={bookImg} alt="" style={{ width:'100%', height:'100%', objectFit:'fill', display:'block' }} />
            </div>
            <div style={{ position:'absolute', inset:0, background:'#181210', backfaceVisibility:'hidden', transform:'rotateY(180deg)', borderRadius:'3px 6px 6px 3px' }} />
          </motion.div>
        </motion.div>
      </motion.div>
    </div>,
    document.body,
  );
}

export function BookTransitionOverlay() {
  return <BookTransitionShell />;
}
