/**
 * BookTransitionOverlay — cinematic Home → BookReader transition
 *
 * Single-shell architecture: one fixed wrapper holds BOTH the PNG and the
 * OpeningBookStage. Only the shell moves/scales; internal content crossfades.
 *
 * Phase timeline:
 *   0           snap:    shell at card rect, PNG visible, stage pre-mounted (opacity 0)
 *   1  (0–420)  center:  shell glides + scales to centre; dark overlay fades in
 *   2  (440)    swap:    PNG fades out, Stage fades in (140 ms each)
 *   3  (560)    open:    cover rotateY 0 → -115 deg (550 ms)
 *   4  (1150)   expand:  shell scales to fill viewport; cover+body fade; inner page
 *                        expands to inset:0; dark overlay fades out (420 ms)
 *   5  (1600)   reveal:  navigate; shell opacity 1 → 0 (350 ms)
 *   6  (1950)   done:    clearTransition
 *
 * Chapter.tsx picks up a "bookEntryTransition" flag from sessionStorage and
 * renders its own cream overlay that fades out on mount, bridging the handoff.
 *
 * The inner page insets (8.33% H) match objectFit:contain letterboxing of the
 * PNG (image 2:3, container 4:5) for pixel-perfect crossfade alignment.
 */

import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import bookImg from '@/assets/book-3d-v3.png';
import { useBookTransition } from '@/context/BookTransitionContext';
import { chapters } from '@/mocks/data';
import { CURRENT_CHAPTER_ID } from '@/mocks/config';

type Phase = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const STAGE_INSET_X = '8.33%';

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

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setLocation(transition.targetPath);
      clearTransition();
      return;
    }

    setPhase(0);
    killTimers();

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => {
        setPhase(1);
        at(() => setPhase(2), 440);
        at(() => setPhase(3), 560);
        at(() => setPhase(4), 1150);
        at(() => {
          // Signal Chapter.tsx to show its own cream bridge overlay
          sessionStorage.setItem('bookEntryTransition', '1');
          setLocation(transition.targetPath);
          setPhase(5);
        }, 1600);
        at(() => clearTransition(), 1950);
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

  // Centered state (phases 1–3)
  const targetW = Math.min(vw * 0.72, 310);
  const scale   = targetW / bookRect.width;
  const dx      = (vw - bookRect.width  * scale) / 2 - bookRect.left;
  const dy      = (vh - bookRect.height * scale) / 2 - bookRect.top;

  // Expanded state (phases 4–5) — shell fills full viewport
  const expandTotalScale = Math.max(vw / bookRect.width, vh / bookRect.height);
  const expandDx = (vw - bookRect.width  * expandTotalScale) / 2 - bookRect.left;
  const expandDy = (vh - bookRect.height * expandTotalScale) / 2 - bookRect.top;

  const chapter = chapters.find(c => c.id === CURRENT_CHAPTER_ID);

  /* ── Shell ────────────────────────────────────────────────────────────────*/
  const shellTransform = phase >= 4
    ? `translate(${expandDx}px, ${expandDy}px) scale(${expandTotalScale})`
    : phase >= 1
    ? `translate(${dx}px, ${dy}px) scale(${scale})`
    : 'translate(0px, 0px) scale(1)';

  const shellTransition = phase === 5
    ? 'opacity 350ms ease-out'
    : (phase === 1 || phase === 4)
    ? 'transform 420ms cubic-bezier(0.22,1,0.36,1)'
    : 'none';

  const shellOpacity = phase >= 5 ? 0 : 1;

  /* ── Dark overlay ─────────────────────────────────────────────────────────*/
  const bgOpacity    = phase >= 4 ? 0 : phase >= 1 ? 0.94 : 0;
  const bgTransition = phase === 4
    ? 'opacity 350ms ease-out'
    : phase === 1
    ? 'opacity 360ms ease-out'
    : 'none';

  /* ── Ambient glow ─────────────────────────────────────────────────────────*/
  const glowOpacity    = phase >= 4 ? 0 : phase === 3 ? 0.65 : phase === 2 ? 0.30 : 0;
  const glowTransition = phase === 4 ? 'opacity 200ms ease-out' : 'opacity 300ms ease-out';

  /* ── PNG (phase 0-1 visible, fades in phase 2) ────────────────────────────*/
  const pngOpacity    = phase >= 2 ? 0 : 1;
  const pngTransition = phase === 2 ? 'opacity 140ms ease-out' : 'none';

  /* ── Stage (pre-mounted at 0; fades in at phase 2, stays until shell fades)*/
  const stageOpacity    = phase >= 2 ? 1 : 0;
  const stageTransition = phase === 2 ? 'opacity 140ms ease-in' : 'none';

  /* ── Book body (dark) — fades out in phase 4 ─────────────────────────────*/
  const bodyOpacity    = phase >= 4 ? 0 : 1;
  const bodyTransition = phase === 4 ? 'opacity 250ms ease-out' : 'none';

  /* ── Cover rotation & fade ────────────────────────────────────────────────*/
  const coverDeg        = phase >= 3 ? -115 : 0;
  const coverOpacity    = phase >= 4 ? 0 : 1;
  const coverTransition = phase === 4
    ? 'opacity 200ms ease-out'
    : phase === 3
    ? 'transform 550ms cubic-bezier(0.22,1,0.36,1)'
    : 'none';

  /* ── Shadow on inner page (sweeps away as cover opens) ───────────────────*/
  const shadowOpacity    = phase >= 3 ? 0 : 1;
  const shadowTransition = phase === 3 ? 'opacity 500ms ease-out 60ms' : 'none';

  /* ── Spine light ─────────────────────────────────────────────────────────*/
  const spineLightOpacity    = phase >= 4 ? 0 : phase === 3 ? 0.65 : 0;
  const spineLightTransition = phase === 4
    ? 'opacity 150ms ease-out'
    : phase === 3
    ? 'opacity 350ms ease-in'
    : 'opacity 200ms ease-out';

  /* ── Inner page insets: padded (phases 0-3) → fills shell (phase 4+) ─────*/
  const pageTop    = phase >= 4 ? 0   : '3%';
  const pageBottom = phase >= 4 ? 0   : '3%';
  const pageLeft   = phase >= 4 ? 0   : '5%';
  const pageRight  = phase >= 4 ? 0   : '4%';
  const ease       = 'cubic-bezier(0.22,1,0.36,1)';
  const pageTransition = phase === 4
    ? `top 420ms ${ease}, bottom 420ms ${ease}, left 420ms ${ease}, right 420ms ${ease}`
    : 'none';

  return (
    <>
      {/* ── Dark overlay ─────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed', inset: 0,
          background:    '#050505',
          opacity:        bgOpacity,
          transition:     bgTransition,
          zIndex:         9990,
          pointerEvents: phase >= 1 && phase < 5 ? 'all' : 'none',
        }}
      />

      {/* ── Ambient glow ─────────────────────────────────────────────────── */}
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

      {/* ── Single shell ─────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position:        'fixed',
          top:              bookRect.top,
          left:             bookRect.left,
          width:            bookRect.width,
          height:           bookRect.height,
          overflow:        'hidden',
          transform:        shellTransform,
          transition:       shellTransition,
          transformOrigin: 'top left',
          opacity:          shellOpacity,
          zIndex:           9999,
          pointerEvents:   'none',
          willChange:      'transform',
        }}
      >
        {/* PNG — visible phases 0-1, fades out in phase 2 */}
        <img
          src={bookImg}
          alt=""
          style={{
            position:       'absolute', inset: 0,
            width:          '100%', height: '100%',
            objectFit:      'contain', objectPosition: 'center center',
            display:        'block',
            opacity:         pngOpacity,
            transition:      pngTransition,
          }}
        />

        {/* Opening Book Stage — pre-mounted at opacity 0 */}
        <div
          style={{
            position:   'absolute',
            top: 0, bottom: 0,
            left:  STAGE_INSET_X, right: STAGE_INSET_X,
            opacity:     stageOpacity,
            transition:  stageTransition,
            perspective: '1200px',
          }}
        >
          {/* Book body — dark background */}
          <div
            style={{
              position:     'absolute', inset: 0,
              background:   '#0d0b09',
              borderRadius: '3px 6px 6px 3px',
              boxShadow:    '6px 0 20px rgba(0,0,0,0.7)',
              opacity:       bodyOpacity,
              transition:    bodyTransition,
            }}
          />

          {/* Inner page — cream, expands to fill stage in phase 4 */}
          <div
            style={{
              position:     'absolute',
              top:           pageTop,
              bottom:        pageBottom,
              left:          pageLeft,
              right:         pageRight,
              transition:    pageTransition,
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
            {/* Spine light */}
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

            {/* Shadow cast by cover */}
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

          {/* Cover */}
          <div
            style={{
              position:        'absolute', inset: 0,
              transformStyle:  'preserve-3d',
              transformOrigin: 'left center',
              transform:       `rotateY(${coverDeg}deg)`,
              opacity:          coverOpacity,
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
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '60% center', display: 'block' }}
              />
            </div>
            {/* Back face */}
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
