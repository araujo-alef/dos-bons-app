/**
 * BookTransitionOverlay — cinematic Home → BookReader transition
 *
 * Single-shell architecture: one fixed wrapper holds BOTH the PNG and the
 * OpeningBookStage. Only the shell moves (phase 1). The contents crossfade
 * internally (phase 2), so position/scale are always identical — no jump.
 *
 * Phase timeline (≈1280ms):
 *   0  snap      shell at card rect, PNG visible, stage hidden (opacity 0)
 *   1  (0→420ms) shell glides to centre + scales up; overlay darkens
 *   2  (440ms)   PNG fades out, Stage fades in — both inside same shell
 *   3  (560ms)   cover rotates: rotateY(0 → -115deg) over 550ms
 *   4  (950ms)   navigate; shell + overlay fade; BookReader uncovered
 *   5  (1280ms)  clearTransition
 *
 * The Stage is pre-mounted at opacity:0 to avoid layout-cost on first show.
 * The PNG visual bounds (objectFit:contain letterboxes ≈8.3% each side) are
 * reproduced exactly in the Stage via matching insets — so the crossfade is
 * geometrically invisible even in slow-motion.
 *
 * prefers-reduced-motion → immediate navigate, no animation.
 */
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import bookImg from '@/assets/book-3d-v3.png';
import { useBookTransition } from '@/context/BookTransitionContext';
import { chapters } from '@/mocks/data';
import { CURRENT_CHAPTER_ID } from '@/mocks/config';

type Phase = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * The book PNG is 1024×1536 (aspect 2:3).
 * The shell inherits the card rect (aspect 4:5 = 0.8).
 * objectFit:contain → image fills height, letterboxes horizontally.
 * Visual book width = shellH × (2/3) = shellW × 1.25 × (2/3) = shellW × 0.8333
 * Horizontal inset each side = (1 − 0.8333) / 2 × 100% ≈ 8.33%
 * Vertical inset = 0 (image fills full height)
 */
const STAGE_INSET_X = '8.33%';
const STAGE_INSET_Y = '0%';

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

    // Double-rAF: phase-0 render must commit before transitions begin
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => {
        setPhase(1);                                              // shell → centre
        at(() => setPhase(2), 308);                              // crossfade
        at(() => setPhase(3), 392);                              // open cover
        at(() => { setLocation(transition.targetPath); setPhase(4); }, 665);
        at(() => clearTransition(), 896);
      });
    });

    return killTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transition?.targetPath]);

  if (!transition) return null;

  /* ── Geometry ─────────────────────────────────────────────────────────────*/
  const { bookRect } = transition;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Target width = 72% vw, capped at 310px (single page portrait)
  const targetW = Math.min(vw * 0.72, 310);
  const scale   = targetW / bookRect.width;
  const dx      = (vw - bookRect.width  * scale) / 2 - bookRect.left;
  const dy      = (vh - bookRect.height * scale) / 2 - bookRect.top;

  const chapter = chapters.find(c => c.id === CURRENT_CHAPTER_ID);

  /* ── Per-phase derived values ─────────────────────────────────────────────*/

  // Shell: translate + scale (only transitions in phase 1, then freezes)
  const shellTransform  = phase >= 1
    ? `translate(${dx}px, ${dy}px) scale(${scale})`
    : 'translate(0px, 0px) scale(1)';
  const shellTransition = phase === 1
    ? 'transform 294ms cubic-bezier(0.22,1,0.36,1)'
    : 'none';                       // ← frozen in place for phases 2–5

  // PNG: visible in phases 0–1, fades out at phase 2
  const pngOpacity    = phase >= 2 ? 0 : 1;
  const pngTransition = phase === 2 ? 'opacity 98ms ease-out' : 'none';

  // Stage: pre-mounted at opacity 0; fades in at phase 2, out at phase 4
  const stageOpacity    = phase >= 4 ? 0 : phase >= 2 ? 1 : 0;
  const stageTransition = phase >= 4
    ? 'opacity 210ms ease-out'
    : phase === 2
    ? 'opacity 98ms ease-in'
    : 'none';

  // Cover rotation (only in phase 3)
  const coverDeg        = phase >= 3 ? -115 : 0;
  const coverTransition = phase === 3
    ? 'transform 385ms cubic-bezier(0.22,1,0.36,1)'
    : 'none';

  // Shadow on inner page (sweeps away as cover opens)
  const shadowOpacity    = phase >= 3 ? 0 : 1;
  const shadowTransition = phase === 3 ? 'opacity 350ms ease-out 42ms' : 'none';

  // Spine light (purple/warm, appears as cover opens)
  const spineLightOpacity    = phase === 3 ? 0.65 : 0;
  const spineLightTransition = phase === 3
    ? 'opacity 245ms ease-in'
    : 'opacity 140ms ease-out';

  // Ambient glow (peaks at phase 3)
  const glowOpacity    = phase === 3 ? 0.65 : phase === 2 ? 0.30 : 0;
  const glowTransition = 'opacity 300ms ease-out';

  // Dark overlay
  const bgOpacity    = phase >= 4 ? 0 : phase >= 1 ? 0.94 : 0;
  const bgTransition = phase >= 4
    ? 'opacity 280ms ease-out'
    : phase === 1
    ? 'opacity 252ms ease-out'
    : 'none';

  return (
    <>
      {/* ── Dark overlay ─────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed', inset: 0,
          background: '#050505',
          opacity:     bgOpacity,
          transition:  bgTransition,
          zIndex:      9990,
          pointerEvents: phase >= 1 && phase < 4 ? 'all' : 'none',
        }}
      />

      {/* ── Ambient purple glow ──────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position:   'fixed', inset: 0,
          background: 'radial-gradient(ellipse 60% 44% at 50% 50%, rgba(178,102,255,0.32) 0%, transparent 68%)',
          filter:     'blur(18px)',
          opacity:     glowOpacity,
          transition:  glowTransition,
          zIndex:      9991,
          pointerEvents: 'none',
        }}
      />

      {/* ── Single shell — owns position & scale for all phases ──────────── */}
      {/* Both PNG and Stage live here; only shell moves (phase 1).           */}
      {/* After phase 1 shell freezes → zero position delta between children. */}
      <div
        aria-hidden="true"
        style={{
          position:        'fixed',
          top:              bookRect.top,
          left:             bookRect.left,
          width:            bookRect.width,
          height:           bookRect.height,
          transform:        shellTransform,
          transition:       shellTransition,
          transformOrigin: 'top left',
          zIndex:           9999,
          pointerEvents:   'none',
          willChange:      'transform',
        }}
      >
        {/* PNG — objectFit:contain letterboxes ≈8.3% each side horizontally */}
        <img
          src={bookImg}
          alt=""
          style={{
            position:       'absolute', inset: 0,
            width:          '100%',
            height:         '100%',
            objectFit:      'contain',
            objectPosition: 'center center',
            display:        'block',
            opacity:         pngOpacity,
            transition:      pngTransition,
          }}
        />

        {/* Opening Book Stage — pre-mounted at opacity:0, insets match PNG   */}
        {/* visual bounds so both representations overlap pixel-perfectly.     */}
        <div
          style={{
            position:   'absolute',
            top:         STAGE_INSET_Y, bottom: STAGE_INSET_Y,
            left:        STAGE_INSET_X, right:  STAGE_INSET_X,
            opacity:     stageOpacity,
            transition:  stageTransition,
            perspective: '1200px',
          }}
        >
          {/* Book body — dark page interior */}
          <div
            style={{
              position:     'absolute', inset: 0,
              background:   '#0d0b09',
              borderRadius: '3px 6px 6px 3px',
              boxShadow:    '6px 0 20px rgba(0,0,0,0.7)',
            }}
          />

          {/* Inner page — cream, with chapter content */}
          <div
            style={{
              position:     'absolute',
              top: '3%', bottom: '3%', left: '5%', right: '4%',
              background:   'linear-gradient(150deg, #f2e9d4 0%, #ece0c4 100%)',
              borderRadius: '2px 5px 5px 2px',
              overflow:     'hidden',
              display:      'flex',
              flexDirection: 'column',
              alignItems:   'center',
              justifyContent: 'center',
              padding:      '16px 14px',
            }}
          >
            {/* Spine light — purple/warm from left edge */}
            <div
              style={{
                position:   'absolute', top: '20%', bottom: '20%', left: 0,
                width:      '22%',
                background: 'radial-gradient(ellipse at 0% 50%, rgba(190,140,255,0.75) 0%, rgba(255,240,200,0.15) 50%, transparent 80%)',
                opacity:     spineLightOpacity,
                transition:  spineLightTransition,
              }}
            />

            <span style={{ position: 'relative', fontSize: '8px', fontWeight: 700, letterSpacing: '0.22em', color: 'rgba(70,35,10,0.45)', fontFamily: 'Inter, sans-serif', marginBottom: '7px' }}>
              CAPÍTULO {chapter?.number ?? '01'}
            </span>
            <h2 style={{ position: 'relative', fontSize: '13px', fontWeight: 600, color: '#251508', textAlign: 'center', lineHeight: 1.3, fontFamily: "'Playfair Display', serif", margin: 0 }}>
              {chapter?.title ?? ''}
            </h2>
            <div style={{ position: 'relative', width: '22px', height: '1px', background: 'rgba(70,35,10,0.22)', margin: '10px auto' }} />
            <p style={{ position: 'relative', fontSize: '7.5px', color: 'rgba(70,35,10,0.38)', textAlign: 'center', fontFamily: 'Inter, sans-serif', fontStyle: 'italic', lineHeight: 1.5, maxWidth: '82%', margin: 0 }}>
              {chapter?.intro ?? ''}
            </p>

            {/* Cover shadow — sweeps left→right as cover opens */}
            <div
              style={{
                position:     'absolute', inset: 0,
                background:   'linear-gradient(to right, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 45%, transparent 100%)',
                opacity:       shadowOpacity,
                transition:    shadowTransition,
                borderRadius: 'inherit',
              }}
            />
          </div>

          {/* Cover — rotates around left edge (spine = dobradiça) */}
          <div
            style={{
              position:        'absolute', inset: 0,
              transformStyle:  'preserve-3d',
              transformOrigin: 'left center',
              transform:       `rotateY(${coverDeg}deg)`,
              transition:       coverTransition,
            }}
          >
            {/* Front face */}
            <div
              style={{
                position:          'absolute', inset: 0,
                backfaceVisibility: 'hidden',
                borderRadius:      '3px 6px 6px 3px',
                overflow:          'hidden',
              }}
            >
              <img
                src={bookImg}
                alt=""
                style={{
                  width: '100%', height: '100%',
                  objectFit: 'cover', objectPosition: '60% center',
                  display: 'block',
                }}
              />
            </div>

            {/* Back face — matte inner side */}
            <div
              style={{
                position:          'absolute', inset: 0,
                background:        '#181210',
                backfaceVisibility: 'hidden',
                transform:         'rotateY(180deg)',
                borderRadius:      '3px 6px 6px 3px',
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
