import { Link } from 'wouter';
import book3dV3 from '@/assets/book-3d-v3.png';
import { CURRENT_CHAPTER_ID } from '@/mocks/config';

/* ─── Chain SVG (generated) ────────────────────────────────────────────────
   Horizontal and vertical ellipses are rendered in two passes so vertical
   links appear to sit "in front of" horizontal links (classic chain look).
   A handful of links receive a purple-tinted stroke to suggest reflection.  */
const H_COUNT   = 16;          // horizontal link count
const SPACING   = 18;          // px between horizontal link centers
const CHAIN_W   = (H_COUNT - 1) * SPACING + 18; // ≈ 288px
const CHAIN_H   = 24;

function ChainSVG() {
  // Indexes that receive a purple highlight (spread them irregularly)
  const purpleH = new Set([2, 7, 11]);
  const purpleV = new Set([4, 9, 13]);

  return (
    <svg
      width={CHAIN_W}
      height={CHAIN_H}
      viewBox={`0 0 ${CHAIN_W} ${CHAIN_H}`}
      fill="none"
      aria-hidden="true"
    >
      {/* Pass 1: horizontal links — drawn first so vertical sit on top */}
      {Array.from({ length: H_COUNT }, (_, i) => {
        const cx = i * SPACING + 9;
        const lit = purpleH.has(i);
        return (
          <ellipse
            key={`h${i}`}
            cx={cx} cy={12}
            rx={8.5} ry={4.2}
            stroke={lit ? '#4A2878' : '#1C1628'}
            strokeWidth="1.3"
            fill={lit ? '#140F20' : '#0C0A12'}
          />
        );
      })}
      {/* Pass 2: vertical links — interlocked between horizontal pairs */}
      {Array.from({ length: H_COUNT - 1 }, (_, i) => {
        const cx = i * SPACING + 18;
        const lit = purpleV.has(i);
        return (
          <ellipse
            key={`v${i}`}
            cx={cx} cy={12}
            rx={4.2} ry={9}
            stroke={lit ? '#5A3490' : '#18142A'}
            strokeWidth="1.3"
            fill={lit ? '#110D1E' : '#0A0810'}
          />
        );
      })}
    </svg>
  );
}

/* ─── Lightning bolt SVG shapes ─────────────────────────────────────────── */
/** Tall bolt pointing down-right */
function BoltA() {
  return (
    <svg width="16" height="46" viewBox="0 0 16 46" fill="none" aria-hidden="true"
      style={{ filter: 'drop-shadow(0 0 5px #B266FF)' }}>
      <path
        d="M 3,0 L 9,15 L 5,15 L 12,30 L 7,30 L 13,45"
        stroke="#B266FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

/** Tall bolt pointing down-left (mirrored) */
function BoltB() {
  return (
    <svg width="16" height="44" viewBox="0 0 16 44" fill="none" aria-hidden="true"
      style={{ filter: 'drop-shadow(0 0 5px #D6B2FF)' }}>
      <path
        d="M 13,0 L 7,14 L 11,14 L 4,28 L 8,28 L 2,42"
        stroke="#D6B2FF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

/** Short bolt, front-left */
function BoltC() {
  return (
    <svg width="12" height="30" viewBox="0 0 12 30" fill="none" aria-hidden="true"
      style={{ filter: 'drop-shadow(0 0 4px #B266FF)' }}>
      <path
        d="M 4,0 L 9,10 L 6,10 L 10,22 L 7,22 L 11,30"
        stroke="#B266FF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

/** Short horizontal bolt, front-right */
function BoltD() {
  return (
    <svg width="36" height="14" viewBox="0 0 36 14" fill="none" aria-hidden="true"
      style={{ filter: 'drop-shadow(0 0 4px #D6B2FF)' }}>
      <path
        d="M 0,8 L 13,4 L 11,9 L 23,5 L 21,10 L 36,7"
        stroke="#D6B2FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
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
  return (
    <Link href={`/jornada/capitulo/${CURRENT_CHAPTER_ID}`} className="block no-underline">
      <div
        className="book-card-wrap relative w-full aspect-[4/5] rounded-[14px] overflow-hidden group border border-white/[0.07]"
        style={{ background: '#08070B' }}
        data-testid="card-product-jornada"
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
              'radial-gradient(ellipse at 50% 55%, rgba(178,102,255,0.36) 0%, rgba(139,53,255,0.16) 42%, transparent 70%)',
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
              'radial-gradient(ellipse at 50% 50%, rgba(139,53,255,0.12) 0%, transparent 65%)',
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
              'radial-gradient(ellipse 78% 55% at 50% 36%, rgba(178,102,255,0.18) 0%, transparent 70%)',
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

        {/* ── z-[40] Book image — floating ─────────────────────────────── */}
        <div
          className="absolute inset-x-0"
          style={{
            top: '4%',
            height: '82%',
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
          <div
            className="group-hover:translate-y-[-2px] transition-transform duration-700 ease-out"
            style={{
              width: '88%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={book3dV3}
              alt="Cachorro dos Bons"
              className="book-float"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                objectPosition: 'center center',
                /* PNG has true transparency — no blend override needed */
                mixBlendMode: 'normal',
                willChange: 'transform',
              }}
              loading="eager"
            />
          </div>
        </div>

        {/* ── z-[45] Front sparks — above book, inside book zone (not text) */}
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
    </Link>
  );
}
