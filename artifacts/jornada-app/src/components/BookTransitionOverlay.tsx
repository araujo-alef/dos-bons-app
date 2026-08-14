/**
 * BookTransitionOverlay — cinematic Home → Reader transition
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * ARCHITECTURE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  createPortal → document.body
 *    └─ outer fixed wrapper (perspective: 1200px)
 *         ├─ dark overlay            (fades in during launch)
 *         ├─ ambient glow            (visible during opening/flip phases)
 *         └─ shell (shellCtrl: x/y/scale only, transform-style:preserve-3d)
 *              └─ BookFlightObject (bookRotCtrl: rotateY/X/Z, preserve-3d)
 *                   ├─ front face  — book PNG, backface-hidden
 *                   ├─ back face   — dark back, rotateY(180deg), backface-hidden
 *                   ├─ spine face  — left edge, rotateY(-90deg) from left center
 *                   └─ pages face  — right edge, rotateY(90deg) from right center
 *              (after crossfade, OpeningBookStage takes over at opacity 1)
 *                   └─ OpeningBookStage (cover + flip pages)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * 3D FLIGHT MANEUVER — rotateY sweep 0 → 360°
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  0°    front (leaves card)
 *  30°   slight lean — starts banking into curve
 *  90°   pages edge faces viewer (right side visible)
 *  180°  back cover faces viewer (book is "upside down" in arc)
 *  270°  spine faces viewer (lombada)
 *  330°  front re-emerging
 *  360°  fully front again — ready to open
 *
 *  rotateX adds nose-dive / pull-up feeling.
 *  rotateZ adds banking (small values — book is heavy, not a paper plane).
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * CRITICAL: MOUNT-BEFORE-ANIMATE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  framer-motion resolves controls.start() immediately for unmounted elements.
 *  We always render the shell when transition is set (never return null early),
 *  and use double-rAF inside useLayoutEffect to guarantee paint before any
 *  controls.start() call.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * PHASE TIMELINE  (total ≈ 2.0 s)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *   idle           shell at card pos — waits for paint
 *   detaching      0–40ms    1-2 frame pause
 *   launching      40–790ms  750ms 3D flight maneuver
 *   centering      790–890ms 100ms stabilisation pause
 *   crossfading    890–1010ms 120ms BookFlightObject → OpeningBookStage
 *   opening        1010–1410ms cover rotateY 0 → -105° (400ms)
 *   flippingBack   1210–1730ms pages stagger (overlaps opening tail)
 *   zooming        1730–2030ms shell expands to fill viewport (300ms)
 *   revealingReader 2030ms   navigate + shell fades (150ms)
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

/* ─── FlipPage helpers ───────────────────────────────────────────────────── */

const PAGE_BG = [
  'linear-gradient(to right,#d5ccb6,#e4dbca)',
  'linear-gradient(to right,#dbd2bc,#e9e0ce)',
  'linear-gradient(to right,#dfd6c0,#ece3d2)',
  'linear-gradient(to right,#e2d9c3,#eee5d5)',
  'linear-gradient(to right,#e5dcc6,#f0e7d7)',
  'linear-gradient(to right,#e8e0cb,#f2e9da)',
];

/** Quadratic-bezier wave that looks like cartoon scribble text. */
function wigglyPath(x0: number, y: number, x1: number, amp: number): string {
  const wl = 5;
  let d = `M ${x0.toFixed(1)},${y.toFixed(1)}`;
  let dir = 1;
  for (let x = x0; x < x1; x += wl) {
    const cx = x + wl / 2;
    const ex = Math.min(x + wl, x1);
    d += ` Q ${cx.toFixed(1)},${(y + amp * dir).toFixed(1)} ${ex.toFixed(1)},${y.toFixed(1)}`;
    dir *= -1;
  }
  return d;
}

// [y, x-end (out of 100), amplitude] — varied widths mimic real text lines
const WIGGLE_LINES: [number, number, number][] = [
  [12, 94, 1.4],
  [24, 100, 1.6],
  [36, 78, 1.3],
  [48, 97, 1.5],
  [60, 86, 1.4],
  [72, 50, 1.6],
];

function WigglyLines() {
  return (
    <svg
      viewBox="0 0 100 85"
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ position:'absolute', inset:'10% 16% 16% 14%', opacity:0.12 }}
    >
      {WIGGLE_LINES.map(([y, x1, amp], i) => (
        <path
          key={i}
          d={wigglyPath(0, y, x1, amp)}
          stroke="#251508"
          strokeWidth="1.9"
          fill="none"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

/* ─── FlipPage ───────────────────────────────────────────────────────────── */
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
        zIndex: NUM_FLIP - index,
      }}
    >
      {/* front */}
      <div style={{
        position: 'absolute', inset: 0,
        background: PAGE_BG[index],
        backfaceVisibility: 'hidden',
        overflow: 'hidden',
      }}>
        <WigglyLines />
        <div style={{ position:'absolute', bottom:'6%', right:'8%', fontSize:'6px', color:'rgba(37,21,8,0.22)', fontFamily:'serif' }}>
          {index + 1}
        </div>
        <div style={{ position:'absolute', top:0, bottom:0, left:0, width:'14%', background:'linear-gradient(to right,rgba(0,0,0,0.14),transparent)' }} />
      </div>
      {/* back */}
      <div style={{ position:'absolute', inset:0, background:'#ddd4be', transform:'rotateY(180deg)', backfaceVisibility:'hidden' }} />
    </motion.div>
  );
}

/* ─── BookFlightObject ───────────────────────────────────────────────────────
 *
 *  A CSS 3D box that represents the book during the flight phase.
 *  Four faces — front, back, spine (left), pages-edge (right).
 *  Faces use backface-visibility:hidden so each is only visible when facing
 *  toward the camera.
 *
 *  Face visibility as rotateY increases from 0→360:
 *    0°   → front visible
 *    90°  → pages edge visible (right side of book)
 *    180° → back cover visible
 *    270° → spine visible (lombada)
 *    360° → front visible again
 *
 *  The shell parent moves via x/y/scale (shellCtrl for FM phases; WAAPI during flight).
 *  The BookFlightObject itself is a plain div animated via WAAPI — no Framer Motion
 *  controls on it. WAAPI runs entirely on the compositor, so keyframe boundaries
 *  produce zero JS-thread stutter.
 * ─────────────────────────────────────────────────────────────────────────── */
function BookFlightObject({
  bookFlightRef,
  spineW,
  pagesW,
  phase,
}: {
  bookFlightRef: React.RefObject<HTMLDivElement>;
  spineW: number;
  pagesW: number;
  phase: Phase;
}) {
  // Hide once we crossfade to OpeningBookStage
  const flightVisible = !['crossfading','opening','flippingBack','zooming','revealingReader','complete'].includes(phase);

  return (
    <div
      ref={bookFlightRef}
      style={{
        position:       'absolute',
        inset:          0,
        transformStyle: 'preserve-3d',
        opacity:        flightVisible ? 1 : 0,
        transition:     'opacity 150ms ease-out',
        pointerEvents:  'none',
      }}
    >
      {/* ── Front face ─────────────────────────────────── */}
      <div style={{
        position:          'absolute',
        inset:             0,
        backfaceVisibility:'hidden',
        borderRadius:      '3px 6px 6px 3px',
        overflow:          'hidden',
      }}>
        <img
          src={bookImg}
          alt=""
          style={{ width:'100%', height:'100%', objectFit:'fill', display:'block' }}
        />
      </div>

      {/* ── Back face (dark back cover) ─────────────────── */}
      <div style={{
        position:          'absolute',
        inset:             0,
        transform:         'rotateY(180deg)',
        backfaceVisibility:'hidden',
        borderRadius:      '3px 6px 6px 3px',
        background:        'linear-gradient(135deg, #1c1210 0%, #0d0b09 60%, #141010 100%)',
        // Subtle texture lines to not look like a blank black panel
        boxShadow:         'inset 0 0 40px rgba(0,0,0,0.5)',
      }}>
        {/* Subtle back-cover detail */}
        <div style={{
          position:     'absolute',
          inset:        '10% 12%',
          border:       '1px solid rgba(255,255,255,0.06)',
          borderRadius: 2,
          opacity:      0.6,
        }} />
        <div style={{
          position:   'absolute',
          bottom:     '8%',
          left:       '50%',
          transform:  'translateX(-50%)',
          width:      '30%',
          height:     '2px',
          background: 'rgba(255,80,50,0.25)',
          borderRadius: 1,
        }} />
      </div>

      {/* ── Spine face (left edge — lombada) ────────────── */}
      {/* rotateY(-90deg) from left center → faces -X direction (viewer sees it at book rotateY=270°) */}
      <div style={{
        position:          'absolute',
        top:               0,
        left:              0,
        width:             spineW,
        height:            '100%',
        transform:         'rotateY(-90deg)',
        transformOrigin:   'left center',
        backfaceVisibility:'hidden',
        background:        'linear-gradient(90deg, #1a0808 0%, #2d1010 40%, #220c0c 70%, #1a0808 100%)',
        // Subtle gold/red line on spine
        boxShadow:         'inset -2px 0 4px rgba(0,0,0,0.4)',
      }}>
        <div style={{
          position:   'absolute',
          top:        '8%',
          bottom:     '8%',
          left:       '50%',
          transform:  'translateX(-50%)',
          width:      '1px',
          background: 'rgba(200,80,60,0.3)',
        }} />
      </div>

      {/* ── Pages edge (right edge) ──────────────────────── */}
      {/* rotateY(90deg) from right center → faces +X direction (viewer sees it at book rotateY=90°) */}
      <div style={{
        position:          'absolute',
        top:               0,
        right:             0,
        width:             pagesW,
        height:            '100%',
        transform:         'rotateY(90deg)',
        transformOrigin:   'right center',
        backfaceVisibility:'hidden',
        background:        'linear-gradient(90deg, #f0e8d6 0%, #e8dfc8 30%, #f0e8d6 70%, #e8dfc8 100%)',
      }}>
        {/* Simulated page lines */}
        {[15,25,35,45,55,65,75,85].map((pct) => (
          <div key={pct} style={{
            position:   'absolute',
            top:        `${pct}%`,
            left:       0, right: 0,
            height:     '1px',
            background: 'rgba(180,160,120,0.35)',
          }} />
        ))}
      </div>
    </div>
  );
}

/* ─── Shell ──────────────────────────────────────────────────────────────── */
function BookTransitionShell() {
  const { transition, clearTransition } = useBookTransition();
  const [, setLocation] = useLocation();
  const [phase, setPhase] = useState<Phase>('idle');
  const cancelledRef = useRef(false);

  // Shell: position in space (x, y, scale) — Framer Motion for non-flight phases
  const shellCtrl   = useAnimationControls();
  // Supporting elements
  const overlayCtrl = useAnimationControls();
  const stageCtrl   = useAnimationControls();
  const coverCtrl   = useAnimationControls();

  // Refs for WAAPI during the flight phase
  // WAAPI runs on the compositor — no JS-thread stutter at keyframe boundaries
  const shellRef      = useRef<HTMLDivElement>(null);
  const bookFlightRef = useRef<HTMLDivElement>(null);

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
        const targetW     = vw * 0.88;
        const targetScale = targetW / bookRect.width;

        // Centre the scaled book:
        //   tx = vw/2 − rect.left − (rect.width  × scale)/2
        const tx = vw / 2 - bookRect.left - (bookRect.width  * targetScale) / 2;
        const ty = vh / 2 - bookRect.top  - (bookRect.height * targetScale) / 2;

        // Full-viewport expansion (zooming phase)
        const finalScale = Math.max(vw / bookRect.width, vh / bookRect.height);
        const expandTx   = vw / 2 - bookRect.left - (bookRect.width  * finalScale) / 2;
        const expandTy   = vh / 2 - bookRect.top  - (bookRect.height * finalScale) / 2;

        // Arc geometry
        const dipY = vh * 0.28;          // book drops 28% of viewport height
        const dipX = vw * 0.05;          // slight lateral swing into the curve

        /* ── 7-keyframe flight times ───────────────────────────────────── */
        // These times drive BOTH position and rotation simultaneously.
        // Each index corresponds to a specific orientation + position pair.
        //   0    → at card, front facing (0°)
        //   0.15 → starting to bank / lean (30°)
        //   0.35 → near bottom of arc (90° — pages edge visible)
        //   0.50 → deepest point (180° — back cover visible)
        //   0.68 → coming up (270° — spine visible)
        //   0.84 → re-aligning (330° — front re-emerging)
        //   1.00 → centred, full front (360°)
        const KF_TIMES = [0, 0.15, 0.35, 0.50, 0.68, 0.84, 1.00];

        /* ── detaching (40ms) ──────────────────────────────────────────── */
        setPhase('detaching');
        await sleep(40);
        if (cancelledRef.current) return;

        /* ── launching — WAAPI 3D flight maneuver ──────────────────────────
         *
         *  WHY WAAPI (Web Animations API) instead of Framer Motion:
         *
         *  Framer Motion implements multi-property keyframe animations by
         *  creating per-segment sub-animations internally. At every keyframe
         *  boundary, one sub-animation ends and the next begins — even with
         *  a single ease value — producing a visible micro-stutter on each
         *  joint. With 7 keyframes (6 joints) this was 5-6 visible freezes.
         *
         *  WAAPI runs entirely on the browser's compositor thread. Keyframe
         *  interpolation is native — no JS between frames, no boundary
         *  artifacts. `easing` per keyframe lets us control per-segment
         *  velocity without creating separate animations.
         *
         *  After the WAAPI flight ends:
         *    1. shellCtrl.set() syncs Framer Motion's internal state
         *    2. WAAPI animations are cancelled (FM has already taken over)
         *    3. Remaining phases (open, flip, zoom, fade) continue with FM
         *
         *  POSITION:  5-point arc — leave card → dip 28% vh → rise to centre.
         *             Using 'ease-in' on down-segments, 'ease-out' on up-segments
         *             so velocity is continuous at the dip (no stutter there).
         *  ROTATION:  rotateY 0→360, rotateX nose-dive/pull-up, rotateZ banking.
         * ─────────────────────────────────────────────────────────────── */
        setPhase('launching');

        const FLIGHT_MS            = 1400;
        const CROSSFADE_OVERLAP_MS = 200;

        // Overlay fades in during flight (simple FM animation — fine to fire-and-forget)
        overlayCtrl.start({ opacity: 0.85, transition: { duration: 0.55, ease: 'easeOut' } });

        // ── WAAPI: Shell position ─────────────────────────────────────────
        // translate(x, y) scale(s) — same CSS values FM uses, so set() handoff is seamless.
        // Per-keyframe easing: ease-in on descent (exit fast), ease-out on ascent (arrive soft).
        // At the dip boundary: descent ends at max velocity, ascent starts at max velocity → smooth.
        let shellWaapi: Animation | null = null;
        const shellEl = shellRef.current;
        if (shellEl) {
          shellWaapi = shellEl.animate([
            { transform: `translate(0px, 0px) scale(1)`,
              easing: 'cubic-bezier(0.4,0,1,1)' },                                         // t=0.00 → ease-in (accelerates into dip)
            { transform: `translate(${dipX * 0.5}px, ${dipY * 0.45}px) scale(0.96)`,
              easing: 'cubic-bezier(0.4,0,1,1)', offset: 0.28 },                           // t=0.28 → still accelerating
            { transform: `translate(${dipX}px, ${dipY}px) scale(0.92)`,
              easing: 'cubic-bezier(0,0,0.6,1)', offset: 0.50 },                           // t=0.50 → dip bottom — switch to ease-out
            { transform: `translate(${tx * 0.55}px, ${dipY * 0.25}px) scale(${targetScale * 0.82})`,
              easing: 'cubic-bezier(0,0,0.6,1)', offset: 0.76 },                           // t=0.76 → still decelerating upward
            { transform: `translate(${tx}px, ${ty}px) scale(${targetScale})` },            // t=1.00 → arrived
          ], { duration: FLIGHT_MS, fill: 'forwards' });
        }

        // ── WAAPI: Book rotation ──────────────────────────────────────────
        // 'ease-in-out' per keyframe: each segment has zero velocity at its own
        // start and end, which is fine here because the rotation passes through
        // all 360° — slight ease at each face transition actually looks natural
        // (a brief linger at front/back/spine before rotating away).
        let bookWaapi: Animation | null = null;
        const bookEl = bookFlightRef.current;
        if (bookEl) {
          bookWaapi = bookEl.animate([
            { transform: 'rotateY(0deg)   rotateX(0deg)  rotateZ(0deg)',   easing: 'ease-in-out' },
            { transform: 'rotateY(25deg)  rotateX(10deg) rotateZ(-6deg)',  easing: 'ease-in-out', offset: 0.15 },
            { transform: 'rotateY(90deg)  rotateX(22deg) rotateZ(-13deg)', easing: 'ease-in-out', offset: 0.35 },
            { transform: 'rotateY(180deg) rotateX(24deg) rotateZ(-14deg)', easing: 'ease-in-out', offset: 0.50 },
            { transform: 'rotateY(270deg) rotateX(14deg) rotateZ(-7deg)',  easing: 'ease-in-out', offset: 0.68 },
            { transform: 'rotateY(330deg) rotateX(4deg)  rotateZ(3deg)',   easing: 'ease-in-out', offset: 0.84 },
            { transform: 'rotateY(360deg) rotateX(0deg)  rotateZ(0deg)' },
          ], { duration: FLIGHT_MS, fill: 'forwards' });
        }

        // Wait until 200ms before flight ends, start crossfade overlap
        await sleep(FLIGHT_MS - CROSSFADE_OVERLAP_MS);
        if (cancelledRef.current) return;

        /* ── crossfading 3D book → OpeningBookStage (overlaps tail of flight) ─
         *  BookFlightObject fades out via phase → opacity:0 CSS transition.
         *  OpeningBookStage fades in simultaneously. */
        setPhase('crossfading');
        stageCtrl.start({ opacity: 1, transition: { duration: 0.22, ease: 'easeIn' } });

        await sleep(CROSSFADE_OVERLAP_MS + 60);
        if (cancelledRef.current) return;

        // Sync Framer Motion internal state to where WAAPI landed the shell.
        // Order matters: FM.set() writes its transform BEFORE cancelling WAAPI,
        // so the element never snaps back to the pre-animation position.
        shellCtrl.set({ x: tx, y: ty, scale: targetScale });
        shellWaapi?.cancel();
        bookWaapi?.cancel();

        /* ── opening — cover swings open (400ms); NOT awaited ───────────── */
        setPhase('opening');
        coverCtrl.start({
          rotateY:    -105,
          transition: { duration: 0.40, ease: [0.22, 1, 0.36, 1] },
        });
        await sleep(200); // 200ms into opening, flip begins
        if (cancelledRef.current) return;

        /* ── flippingBack — stagger via phase state ─────────────────────── */
        setPhase('flippingBack');
        await sleep(520);
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
  if (!transition) return null;

  const { bookRect } = transition;

  // Spine width ~8% of book width; pages edge ~6%
  const spineW = Math.max(10, bookRect.width * 0.08);
  const pagesW = Math.max(8,  bookRect.width * 0.06);

  const proxyVisible = ['flippingBack','zooming','revealingReader','complete'].includes(phase);
  const glowVisible  = ['crossfading','opening','flippingBack'].includes(phase);
  const blocking     = !['idle','complete'].includes(phase);

  return createPortal(
    <div
      aria-hidden="true"
      style={{
        position:      'fixed',
        inset:         0,
        zIndex:        9980,
        // Perspective on outer container makes all rotateY look genuinely 3D
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

      {/* Ambient glow (purple) — visible during opening phases */}
      <div style={{
        position:   'fixed',
        inset:      0,
        background: 'radial-gradient(ellipse 60% 44% at 50% 50%, rgba(178,102,255,0.32) 0%, transparent 68%)',
        filter:     'blur(18px)',
        opacity:     glowVisible ? 0.60 : 0,
        transition: 'opacity 300ms ease-out',
        zIndex:     2,
        pointerEvents: 'none',
      }} />

      {/* ── BookTransitionShell ──────────────────────────────────────────────
       *  Anchored at the book-image DOMRect.
       *  shellCtrl moves it through space (x, y, scale only).
       *  preserve-3d passes the perspective through to inner BookFlightObject.
       * ─────────────────────────────────────────────────────────────────── */}
      <motion.div
        ref={shellRef}
        initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
        animate={shellCtrl}
        style={{
          position:        'fixed',
          top:              bookRect.top,
          left:             bookRect.left,
          width:            bookRect.width,
          height:           bookRect.height,
          transformOrigin: 'top left',
          transformStyle:  'preserve-3d',
          zIndex:          10,
          pointerEvents:   'none',
          willChange:      'transform',
        }}
      >
        {/* ── 3D Book Object (flight phase) ──────────────────────────────
         *  Receives rotateY/X/Z from bookRotCtrl.
         *  Has four CSS 3D faces: front, back, spine, pages-edge.
         *  Fades out when OpeningBookStage crossfades in.
         * ─────────────────────────────────────────────────────────────── */}
        <BookFlightObject
          bookFlightRef={bookFlightRef}
          spineW={spineW}
          pagesW={pagesW}
          phase={phase}
        />

        {/* ── OpeningBookStage — pre-mounted at opacity 0 ──────────────── */}
        {/* Takes over after crossfade; book is centred and frontal by then */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={stageCtrl}
          style={{ position:'absolute', inset:0, perspective:'1200px' }}
        >
          {/* Dark spine / back */}
          <div style={{
            position:'absolute', inset:0,
            background:'#0d0b09',
            boxShadow:'6px 0 20px rgba(0,0,0,0.7)',
          }} />

          {/* Cream proxy page — revealed as pages flip away */}
          <div style={{
            position:'absolute', inset:0,
            background:'linear-gradient(150deg,#f2e9d4 0%,#ece0c4 100%)',
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
            <div style={{ position:'absolute', inset:0, backfaceVisibility:'hidden', overflow:'hidden' }}>
              <img src={bookImg} alt="" style={{ width:'100%', height:'100%', objectFit:'fill', display:'block' }} />
            </div>
            <div style={{ position:'absolute', inset:0, background:'#181210', backfaceVisibility:'hidden', transform:'rotateY(180deg)' }} />
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
