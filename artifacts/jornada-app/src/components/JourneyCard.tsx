import { useRef } from 'react';
import { useLocation } from 'wouter';
import book3dV3 from '@/assets/book-3d-v3.png';
import { CURRENT_CHAPTER_ID } from '@/mocks/config';
import { useBookTransition } from '@/context/BookTransitionContext';

import { ChainSVG } from '@/components/ChainSVG';

const CHAIN_W = (16 - 1) * 18 + 18; // 288px — matches ChainSVG default (16 links)

/* ─── Lightning bolt SVG shapes ─────────────────────────────────────────── */
/** Tall bolt pointing down-right */
function BoltA() {
  return (
    <svg width="16" height="46" viewBox="0 0 16 46" fill="none" aria-hidden="true"
      style={{ filter: 'drop-shadow(0 0 5px #B91C1C)' }}>
      <path
        d="M 3,0 L 9,15 L 5,15 L 12,30 L 7,30 L 13,45"
        stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

/** Tall bolt pointing down-left (mirrored) */
function BoltB() {
  return (
    <svg width="16" height="44" viewBox="0 0 16 44" fill="none" aria-hidden="true"
      style={{ filter: 'drop-shadow(0 0 5px #EF4444)' }}>
      <path
        d="M 13,0 L 7,14 L 11,14 L 4,28 L 8,28 L 2,42"
        stroke="#EF4444" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

/** Short bolt, front-left */
function BoltC() {
  return (
    <svg width="12" height="30" viewBox="0 0 12 30" fill="none" aria-hidden="true"
      style={{ filter: 'drop-shadow(0 0 4px #B91C1C)' }}>
      <path
        d="M 4,0 L 9,10 L 6,10 L 10,22 L 7,22 L 11,30"
        stroke="#DC2626" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

/** Short horizontal bolt, front-right */
function BoltD() {
  return (
    <svg width="36" height="14" viewBox="0 0 36 14" fill="none" aria-hidden="true"
      style={{ filter: 'drop-shadow(0 0 4px #EF4444)' }}>
      <path
        d="M 0,8 L 13,4 L 11,9 L 23,5 L 21,10 L 36,7"
        stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

/* ─── JourneyCard ────────────────────────────────────────────────────────────
   Layer order (bottom → top):

     z-[10]  glow primary     — breathing radial, #B266FF
     z-[12]  glow secondary   — drifting, more diffuse
     z-[14]  hover boost      — fades in on group-hover
     z-[20]  background bolts — behind book (A + B)
     z-[25]  chain            — behind book
     z-[30]  book shadow      — diffuse ellipse below book
     z-[40]  book image       — floating animation
     z-[45]  front sparks     — above book, below text gradient (C + D)
     z-[50]  bottom gradient  — legibility fade
     z-[60]  text labels
   --------------------------------------------------------------------------- */
export function JourneyCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();
  const { startTransition, isTransitioning } = useBookTransition();
  const targetPath = `/jornada/capitulo/${CURRENT_CHAPTER_ID}`;

  function handleClick() {
    if (isTransitioning) return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (rect) {
      startTransition(targetPath, rect);
    } else {
      // Fallback: navigate directly without animation
      setLocation(targetPath);
    }
  }

  return (
      <div
        ref={cardRef}
        className="book-card-wrap relative w-full aspect-[4/5] rounded-[14px] overflow-hidden group border cursor-pointer"
        style={{ background: '#0B0708', borderColor: 'rgba(185,28,28,0.12)' }}
        data-testid="card-product-jornada"
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
        aria-label="Acessar Jornada: Cachorro dos Bons"
      >

        {/* ── z-[10] Glow primary — breathing purple atmosphere ─────────── */}
        <div
          aria-hidden="true"
          className="book-glow-primary group-hover:opacity-[1.15]"
          style={{
            position: 'absolute',
            top: '6%',
            left: '50%',
            zIndex: 10,
            width: '92%',
            height: '70%',
            /* translateX(-50%) lives inside the keyframe so scale() stays centered */
            background:
              'radial-gradient(ellipse at 50% 55%, rgba(180,20,20,0.34) 0%, rgba(140,10,10,0.15) 42%, transparent 70%)',
            filter: 'blur(22px)',
            pointerEvents: 'none',
          }}
        />

        {/* ── z-[12] Glow secondary — slow diagonal drift ───────────────── */}
        <div
          aria-hidden="true"
          className="book-glow-secondary"
          style={{
            position: 'absolute',
            top: '12%',
            left: '50%',
            zIndex: 12,
            width: '115%',
            height: '60%',
            background:
              'radial-gradient(ellipse at 50% 50%, rgba(140,10,10,0.11) 0%, transparent 65%)',
            filter: 'blur(34px)',
            pointerEvents: 'none',
          }}
        />

        {/* ── z-[14] Hover boost — extra glow on desktop hover ─────────── */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
          style={{
            zIndex: 14,
            background:
              'radial-gradient(ellipse 78% 55% at 50% 36%, rgba(185,28,28,0.18) 0%, transparent 70%)',
          }}
        />

        {/* ── z-[20] Background bolt A — upper-left, behind book ───────── */}
        <div
          aria-hidden="true"
          className="bolt-a absolute pointer-events-none"
          style={{ top: '18%', left: '8%', zIndex: 20 }}
        >
          <BoltA />
        </div>

        {/* ── z-[20] Background bolt B — upper-right, behind book ──────── */}
        <div
          aria-hidden="true"
          className="bolt-b absolute pointer-events-none"
          style={{ top: '14%', right: '7%', zIndex: 20 }}
        >
          <BoltB />
        </div>

        {/* ── z-[25] Chain — passes behind the book ────────────────────── */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '55%',
            left: '50%',
            transform: `translateX(-${CHAIN_W / 2}px)`,
            zIndex: 25,
            pointerEvents: 'none',
          }}
        >
          {/* Inner div receives the drift animation (outer keeps centering) */}
          <div className="chain-anim">
            <ChainSVG />
          </div>
        </div>

        {/* ── z-[30] Book shadow — synced ellipse below the book ─────────
            Uses a wrapper for centering so the keyframe doesn't fight the
            translateX(-50%).                                               */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: '11%',
            left: '50%',
            zIndex: 30,
            pointerEvents: 'none',
          }}
        >
          <div
            className="book-shadow-anim"
            style={{
              width: '60%',
              marginLeft: '-30%', /* horizontally center within the wrapper */
              height: '34px',
              background:
                'radial-gradient(ellipse at 50% 60%, rgba(0,0,0,0.62) 0%, transparent 70%)',
              filter: 'blur(9px)',
            }}
          />
        </div>

        {/* ── z-[40] Book image — floating, centered in full card ──────── */}
        <div
          className="absolute inset-0"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 40,
          }}
        >
          {/*
            Hover scale lives on this wrapper — separate DOM element from the
            float animation on <img> so the two transforms don't fight.
          */}
          <img
            src={book3dV3}
            alt="Cachorro dos Bons"
            className="book-float group-hover:translate-y-[-2px] transition-transform duration-700 ease-out"
            style={{
              maxWidth: '82%',
              maxHeight: '90%',
              width: 'auto',
              height: 'auto',
              display: 'block',
              mixBlendMode: 'normal',
              willChange: 'transform',
            }}
            loading="eager"
          />
        </div>

        {/* ── z-[45] Front sparks — above book */}
        <div
          aria-hidden="true"
          className="bolt-c absolute pointer-events-none"
          style={{ top: '38%', left: '5%', zIndex: 45 }}
        >
          <BoltC />
        </div>
        <div
          aria-hidden="true"
          className="bolt-d absolute pointer-events-none"
          style={{ top: '52%', right: '4%', zIndex: 45 }}
        >
          <BoltD />
        </div>


      </div>
  );
}
