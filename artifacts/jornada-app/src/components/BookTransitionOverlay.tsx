/**
 * BookTransitionOverlay — cinematic Home → BookReader transition
 *
 * Phase timeline (≈1280ms total):
 *   0  snap      book rendered at card rect, overlay invisible
 *   1  (0→420ms) book glides to viewport centre, overlay darkens
 *   2  (440ms)   PNG crossfades out, CSS OpeningBookStage fades in (180ms)
 *   3  (600ms)   cover rotates open: rotateY(0 → -115deg) over 550ms
 *   4  (950ms)   navigate; overlay + stage fade; BookReader uncovered
 *   5  (1280ms)  clearTransition
 *
 * prefers-reduced-motion: immediate navigate, no animation.
 */
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import bookImg from '@/assets/book-3d-v3.png';
import { useBookTransition } from '@/context/BookTransitionContext';
import { chapters } from '@/mocks/data';
import { CURRENT_CHAPTER_ID } from '@/mocks/config';

type Phase = 0 | 1 | 2 | 3 | 4 | 5;

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

    // Double-rAF ensures phase-0 render is committed before transitions start
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = requestAnimationFrame(() => {
        setPhase(1);                                              // glide to centre
        at(() => setPhase(2), 440);                              // crossfade PNG→Stage
        at(() => setPhase(3), 600);                              // open cover
        at(() => { setLocation(transition.targetPath); setPhase(4); }, 950); // reveal reader
        at(() => clearTransition(), 1280);                        // done
      });
    });

    return killTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transition?.targetPath]);

  if (!transition) return null;

  /* ── Geometry ────────────────────────────────────────────────────────────── */
  const { bookRect } = transition;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Target width of centred book = 72% vw, capped at 310px (single page)
  const targetW   = Math.min(vw * 0.72, 310);
  const scale     = targetW / bookRect.width;
  const centeredH = bookRect.height * scale;
  const dx        = (vw - bookRect.width  * scale) / 2 - bookRect.left;
  const dy        = (vh - bookRect.height * scale) / 2 - bookRect.top;

  // Fixed position of the stage (same visual centre as the scaled PNG)
  const stageLeft = (vw - targetW) / 2;
  const stageTop  = (vh - centeredH) / 2;

  // Chapter data for the inner page preview
  const chapter = chapters.find(c => c.id === CURRENT_CHAPTER_ID);

  /* ── Per-phase style values ──────────────────────────────────────────────── */

  // PNG outer div: translate + scale
  const pngOuterTransform  = phase >= 1
    ? `translate(${dx}px, ${dy}px) scale(${scale})`
    : 'translate(0px, 0px) scale(1)';
  const pngOuterTransition = phase === 1
    ? 'transform 420ms cubic-bezier(0.22,1,0.36,1)'
    : phase === 2
    ? 'opacity 180ms ease-out'
    : 'none';
  const pngOpacity = phase >= 2 ? 0 : 1;

  // Opening stage opacity
  const stageVisible  = phase >= 2;
  const stageOpacity  = phase >= 4 ? 0 : phase >= 2 ? 1 : 0;
  const stageFadeTime = phase >= 4 ? '300ms' : '180ms';
  const stageEasing   = phase >= 4 ? 'ease-out' : 'ease-in';

  // Cover rotation
  const coverDeg        = phase >= 3 ? -115 : 0;
  const coverTransition = phase === 3
    ? 'transform 550ms cubic-bezier(0.22,1,0.36,1)'
    : 'none';

  // Shadow on inner page (dark left→transparent, fades as cover opens)
  const shadowOpacity    = phase >= 3 ? 0 : 1;
  const shadowTransition = phase === 3 ? 'opacity 500ms ease-out 80ms' : 'none';

  // Spine light (purple/white glow from the left edge as cover opens)
  const spineLightOpacity    = phase === 3 ? 0.65 : 0;
  const spineLightTransition = phase === 3
    ? 'opacity 350ms ease-in'
    : 'opacity 250ms ease-out';

  // Overlay dark background
  const bgOpacity    = phase >= 4 ? 0 : phase >= 1 ? 0.94 : 0;
  const bgTransition = phase >= 4
    ? 'opacity 400ms ease-out'
    : phase === 1
    ? 'opacity 360ms ease-out'
    : 'none';

  // Ambient purple glow (peaks at phase 3)
  const glowOpacity    = phase === 3 ? 0.65 : phase === 2 ? 0.30 : 0;
  const glowTransition = 'opacity 300ms ease-out';

  return (
    <>
      {/* ── Dark overlay ──────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position:   'fixed',
          inset:       0,
          background: '#050505',
          opacity:     bgOpacity,
          transition:  bgTransition,
          zIndex:      9990,
          pointerEvents: phase >= 1 && phase < 4 ? 'all' : 'none',
        }}
      />

      {/* ── Ambient purple glow ────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset:     0,
          background:
            'radial-gradient(ellipse 60% 44% at 50% 50%, rgba(178,102,255,0.32) 0%, transparent 68%)',
          filter:    'blur(18px)',
          opacity:    glowOpacity,
          transition: glowTransition,
          zIndex:     9991,
          pointerEvents: 'none',
        }}
      />

      {/* ── PNG book — glides to centre, then crossfades out ──────────────── */}
      <div
        aria-hidden="true"
        style={{
          position:        'fixed',
          top:              bookRect.top,
          left:             bookRect.left,
          width:            bookRect.width,
          height:           bookRect.height,
          transform:        pngOuterTransform,
          transition:       pngOuterTransition,
          transformOrigin: 'top left',
          opacity:          pngOpacity,
          zIndex:           9999,
          pointerEvents:   'none',
          willChange:      'transform, opacity',
        }}
      >
        <img
          src={bookImg}
          alt=""
          style={{
            width:          '100%',
            height:         '100%',
            objectFit:      'contain',
            objectPosition: 'center center',
            display:        'block',
          }}
        />
      </div>

      {/* ── CSS Opening Book Stage — appears in phase 2, cover opens in phase 3 */}
      {stageVisible && (
        <div
          aria-hidden="true"
          style={{
            position:   'fixed',
            left:        stageLeft,
            top:         stageTop,
            width:       targetW,
            height:      centeredH,
            opacity:     stageOpacity,
            transition: `opacity ${stageFadeTime} ${stageEasing}`,
            zIndex:      9998,
            pointerEvents: 'none',
            perspective: '1200px',
          }}
        >
          {/* ── Book body (represents the page interior / spine) ────────── */}
          <div
            style={{
              position:     'absolute',
              inset:         0,
              background:   '#0d0b09',
              borderRadius: '3px 6px 6px 3px',
              boxShadow:    '6px 0 20px rgba(0,0,0,0.7)',
            }}
          />

          {/* ── Inner page (cream, visible once cover starts opening) ──── */}
          <div
            style={{
              position:     'absolute',
              top:          '3%', bottom: '3%',
              left:         '5%', right: '4%',
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
            {/* Spine light — narrow purple/warm glow from left edge */}
            <div
              style={{
                position:   'absolute',
                top:        '20%', bottom: '20%',
                left:        0,
                width:      '22%',
                background: 'radial-gradient(ellipse at 0% 50%, rgba(190,140,255,0.75) 0%, rgba(255,240,200,0.15) 50%, transparent 80%)',
                opacity:     spineLightOpacity,
                transition:  spineLightTransition,
              }}
            />

            {/* Chapter label */}
            <span
              style={{
                position:      'relative',
                fontSize:      '8px',
                fontWeight:     700,
                letterSpacing: '0.22em',
                color:         'rgba(70,35,10,0.45)',
                fontFamily:    'Inter, sans-serif',
                marginBottom:  '7px',
              }}
            >
              CAPÍTULO {chapter?.number ?? '01'}
            </span>

            {/* Chapter title */}
            <h2
              style={{
                position:   'relative',
                fontSize:   '13px',
                fontWeight:  600,
                color:      '#251508',
                textAlign:  'center',
                lineHeight:  1.3,
                fontFamily: "'Playfair Display', serif",
                margin:      0,
              }}
            >
              {chapter?.title ?? ''}
            </h2>

            {/* Ornament line */}
            <div
              style={{
                position:   'relative',
                width:      '22px',
                height:     '1px',
                background: 'rgba(70,35,10,0.22)',
                margin:     '10px auto',
              }}
            />

            {/* Intro text */}
            <p
              style={{
                position:   'relative',
                fontSize:   '7.5px',
                color:      'rgba(70,35,10,0.38)',
                textAlign:  'center',
                fontFamily: 'Inter, sans-serif',
                fontStyle:  'italic',
                lineHeight:  1.5,
                maxWidth:   '82%',
                margin:      0,
              }}
            >
              {chapter?.intro ?? ''}
            </p>

            {/* Cover shadow — sweeps away as cover opens */}
            <div
              style={{
                position:     'absolute',
                inset:         0,
                background:   'linear-gradient(to right, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 45%, transparent 100%)',
                opacity:       shadowOpacity,
                transition:    shadowTransition,
                borderRadius: 'inherit',
              }}
            />
          </div>

          {/* ── Cover (front + back faces, rotates from spine) ───────────── */}
          <div
            style={{
              position:        'absolute',
              inset:            0,
              transformStyle:  'preserve-3d',
              transformOrigin: 'left center',
              transform:       `rotateY(${coverDeg}deg)`,
              transition:       coverTransition,
            }}
          >
            {/* Front face — book cover image */}
            <div
              style={{
                position:          'absolute',
                inset:              0,
                backfaceVisibility: 'hidden',
                borderRadius:      '3px 6px 6px 3px',
                overflow:          'hidden',
              }}
            >
              <img
                src={bookImg}
                alt=""
                style={{
                  width:          '100%',
                  height:         '100%',
                  objectFit:      'cover',
                  objectPosition: '60% center',
                  display:        'block',
                }}
              />
            </div>

            {/* Back face — matte dark (inner side of cover) */}
            <div
              style={{
                position:          'absolute',
                inset:              0,
                background:        '#181210',
                backfaceVisibility: 'hidden',
                transform:         'rotateY(180deg)',
                borderRadius:      '3px 6px 6px 3px',
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
