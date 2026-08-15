/**
 * LabiaCachorroCard — "Lábia de Cachorro" product card.
 *
 * Built entirely from scratch as layered SVG + CSS animations.
 * The static reference image is used only as visual/palette inspiration.
 *
 * Layer structure (bottom → top):
 *   bg rect + ambient glow
 *   oval badge frame + corner diamonds
 *   title typography
 *   mouth interior (dark ellipse)
 *   [ANIMATED] upper jaw group  (lip + gum + teeth + fangs)
 *   [ANIMATED] lower jaw group  (teeth + gum + lip)
 *   [ANIMATED] chain-left group (metallic interlocking links)
 *   [ANIMATED] chain-right group
 *   impact flash overlay
 *   tagline typography
 *   HTML spark dots (absolute, use CSS custom props for direction)
 *   hover border ring
 *
 * Animation: 3.0s loop
 *   0–30%  idle      mouth open, chain whole
 *   30–46% tension   jaw starts closing, chain vibrates
 *   46–55% bite      jaw fully closed
 *   55–63% break     chain halves fly apart, flash
 *   63–80% aftermath sparks + chain apart fading
 *   80–92% reset     chain fades back, jaw opens
 *   92–100% idle     fully restored
 */

import { useEffect, useRef } from 'react';
import { Link } from 'wouter';

// ── CSS keyframes (injected once) ─────────────────────────────────────────────
const STYLE_ID = 'lc2-kf';
function injectStyles() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
/* Upper jaw slides DOWN to close, UP to open (SVG y-axis) */
@keyframes lc2-upper {
  0%,28%   { transform: translateY(-3px); }  /* open  */
  40%      { transform: translateY(-1px); }  /* tension */
  46%      { transform: translateY(0);    }
  52%      { transform: translateY(3.5px); } /* bite closed */
  60%      { transform: translateY(3.5px); } /* hold */
  80%      { transform: translateY(-3px); }  /* reopen */
  100%     { transform: translateY(-3px); }
}
/* Lower jaw slides UP to close, DOWN to open */
@keyframes lc2-lower {
  0%,28%   { transform: translateY(3px);  }
  40%      { transform: translateY(1px);  }
  46%      { transform: translateY(0);    }
  52%      { transform: translateY(-3.5px);}
  60%      { transform: translateY(-3.5px);}
  80%      { transform: translateY(3px);  }
  100%     { transform: translateY(3px);  }
}
/* Chain left — slides left on break, fades out then back */
@keyframes lc2-cl {
  0%,48%   { transform: translateX(0);    opacity: 1; }
  54%      { transform: translateX(-2px); opacity: 1; }  /* tension */
  61%      { transform: translateX(-14px);opacity: 1; }  /* break   */
  78%      { transform: translateX(-16px);opacity: 0; }  /* fade    */
  85%      { transform: translateX(0);    opacity: 0; }  /* reset   */
  93%      { transform: translateX(0);    opacity: 1; }  /* fade in */
  100%     { transform: translateX(0);    opacity: 1; }
}
/* Chain right */
@keyframes lc2-cr {
  0%,48%   { transform: translateX(0);    opacity: 1; }
  54%      { transform: translateX(2px);  opacity: 1; }
  61%      { transform: translateX(14px); opacity: 1; }
  78%      { transform: translateX(16px); opacity: 0; }
  85%      { transform: translateX(0);    opacity: 0; }
  93%      { transform: translateX(0);    opacity: 1; }
  100%     { transform: translateX(0);    opacity: 1; }
}
/* Shake on impact */
@keyframes lc2-shake {
  0%,50%    { transform: translate(0,0);   }
  57%       { transform: translate(-1px, 0.5px); }
  60%       { transform: translate(1px,-0.5px);  }
  63%       { transform: translate(-0.5px, 0);   }
  66%,100%  { transform: translate(0,0);   }
}
/* Flash at impact point */
@keyframes lc2-flash {
  0%,52%   { opacity: 0; }
  58%      { opacity: 0.5; }
  64%      { opacity: 0; }
  100%     { opacity: 0; }
}
/* Sparks: shoot out from chain break using --sdx/--sdy CSS vars */
@keyframes lc2-spark {
  0%,54%  { transform: translate(0,0)       scale(1);   opacity: 0; }
  60%     { opacity: 1; }
  76%     { transform: translate(var(--sdx),var(--sdy)) scale(0.3); opacity: 0.8; }
  84%     { opacity: 0; }
  100%    { opacity: 0; }
}
/* Subtle ambient glow pulse */
@keyframes lc2-glow {
  0%,100% { opacity: 0.18; }
  50%     { opacity: 0.32; }
}
  `;
  document.head.appendChild(s);
}

const DUR = '3.0s';
const EAS = 'ease-in-out';

// Sparks: [dx, dy, color, size px, delay ms]
type Spark = [string, string, string, number, number];
const SPARKS: Spark[] = [
  ['-10px', '-7px',  '#ef4444', 3,   0  ],
  ['-6px',  '-14px', '#fbbf24', 2.5, 35 ],
  [ '10px', '-7px',  '#ef4444', 3,   15 ],
  [ '6px',  '-14px', '#fca5a5', 2,   55 ],
  ['-4px',   '9px',  '#fbbf24', 2,   25 ],
  [ '4px',   '9px',  '#ef4444', 2.5, 45 ],
];

// Chain link component — one interlocking pair (horizontal + vertical oval)
function Link2({ cx, cy, leftHalf }: { cx: number; cy: number; leftHalf: boolean }) {
  // Vertical connector between this link and the next
  const vcx = leftHalf ? cx + 3.8 : cx - 3.8;
  return (
    <>
      {/* Horizontal oval */}
      <ellipse cx={cx} cy={cy} rx={3.8} ry={2.4}
        fill="none" stroke="#585858" strokeWidth="1.5"/>
      {/* Inner fill for depth */}
      <ellipse cx={cx} cy={cy} rx={2.3} ry={1}
        fill="#2a2a2a"/>
      {/* Highlight */}
      <ellipse cx={cx} cy={cy - 0.8} rx={1.8} ry={0.5}
        fill="rgba(220,220,220,0.28)"/>
      {/* Vertical connector oval */}
      <ellipse cx={vcx} cy={cy} rx={1.6} ry={2.9}
        fill="none" stroke="#3a3a3a" strokeWidth="1.2"/>
    </>
  );
}

// Left chain link x-positions (stop before center)
const L_CX = [8, 16, 24, 32, 40];
// Right chain link x-positions (start after center)
const R_CX = [60, 68, 76, 84, 92];
const CY   = 67; // chain vertical position in viewBox

// Upper teeth: 7 teeth centred at x=50, spacing 6
const UPPER_TEETH = [26, 32, 38, 44, 50, 56, 62, 68, 74];
//                   fangs at index 1 and 7
const LOWER_TEETH = [30, 37, 44, 51, 58, 65, 72];

export function LabiaCachorroCard() {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => { injectStyles(); }, []);

  // Pause animation when scrolled off-screen
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const nodes = el.querySelectorAll<HTMLElement | SVGElement>('[data-lc2]');
    const obs = new IntersectionObserver(
      ([entry]) => {
        const state = entry.isIntersecting ? 'running' : 'paused';
        nodes.forEach(n => { (n as HTMLElement).style.animationPlayState = state; });
      },
      { threshold: 0.05 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const anim = (name: string, extra?: string) =>
    reduced ? 'none' : `${name} ${DUR} ${EAS} infinite${extra ? ' ' + extra : ''}`;

  return (
    <Link
      href="/em-breve/comunidade"
      className="aspect-[4/5]"
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div
        ref={cardRef}
        className="group"
        style={{
          borderRadius: 16,
          border: '1px solid rgba(185,28,28,0.22)',
          background: '#0b0000',
          width: '100%', height: '100%',
          overflow: 'hidden',
          position: 'relative',
          cursor: 'pointer',
          transition: 'border-color 0.3s',
        }}
      >
        {/* ── SVG artwork ──────────────────────────────────────── */}
        <svg
          viewBox="0 0 100 125"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: '100%', display: 'block' }}
          aria-label="Lábia de Cachorro — A lábia que faz ela correr atrás"
        >
          <defs>
            <radialGradient id="lc2-bg" cx="50%" cy="56%" r="52%">
              <stop offset="0%"   stopColor="#3d0000" stopOpacity="0.7"/>
              <stop offset="100%" stopColor="#0b0000" stopOpacity="0"/>
            </radialGradient>
            <linearGradient id="lc2-lip-u" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#e52222"/>
              <stop offset="55%"  stopColor="#b91c1c"/>
              <stop offset="100%" stopColor="#7f1d1d"/>
            </linearGradient>
            <linearGradient id="lc2-lip-l" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#7f1d1d"/>
              <stop offset="45%"  stopColor="#b91c1c"/>
              <stop offset="100%" stopColor="#e52222"/>
            </linearGradient>
            <linearGradient id="lc2-tooth" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#f5f0e6"/>
              <stop offset="100%" stopColor="#c8c3b8"/>
            </linearGradient>
            <radialGradient id="lc2-flash-g" cx="50%" cy="54%" r="22%">
              <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.95"/>
              <stop offset="50%"  stopColor="#ef4444" stopOpacity="0.35"/>
              <stop offset="100%" stopColor="transparent"/>
            </radialGradient>
          </defs>

          {/* ── Background ─────────────────────────────────────── */}
          <rect width="100" height="125" fill="#0b0000"/>
          <rect width="100" height="125" fill="url(#lc2-bg)"/>
          {/* Ambient glow under mouth */}
          <ellipse
            data-lc2
            cx="50" cy="68" rx="30" ry="18"
            fill="#dc2020" fillOpacity="0.18"
            style={{ animation: anim('lc2-glow', 'alternate') }}
          />

          {/* ── Badge oval frame ───────────────────────────────── */}
          <ellipse cx="50" cy="67" rx="44" ry="56"
            fill="none" stroke="#7f1d1d" strokeWidth="0.8" strokeOpacity="0.55"/>
          <ellipse cx="50" cy="67" rx="41" ry="53"
            fill="none" stroke="#991b1b" strokeWidth="0.35" strokeOpacity="0.35"/>

          {/* Corner diamonds */}
          {([
            [50, 12], [50, 122], [7, 67], [93, 67],
          ] as [number, number][]).map(([x, y], i) => (
            <polygon key={i}
              points={`${x},${y-3.2} ${x+2.8},${y} ${x},${y+3.2} ${x-2.8},${y}`}
              fill="#dc2626" fillOpacity="0.75"/>
          ))}
          {/* Side accent lines */}
          <line x1="8" y1="42" x2="8" y2="92"
            stroke="#7f1d1d" strokeWidth="0.4" strokeOpacity="0.4"/>
          <line x1="92" y1="42" x2="92" y2="92"
            stroke="#7f1d1d" strokeWidth="0.4" strokeOpacity="0.4"/>

          {/* ── Title ──────────────────────────────────────────── */}
          <text x="50" y="25" textAnchor="middle"
            fontFamily="Impact,'Arial Black',sans-serif"
            fontSize="7.5" letterSpacing="2.2"
            fill="#e8e0d4" fillOpacity="0.8">
            LÁBIA DE
          </text>
          <text x="50" y="38" textAnchor="middle"
            fontFamily="Impact,'Arial Black',sans-serif"
            fontSize="14.5" letterSpacing="0.8"
            fill="#f0ebe0">
            CACHORRO
          </text>
          {/* Title rule */}
          <line x1="18" y1="41" x2="82" y2="41"
            stroke="#dc2626" strokeWidth="0.4" strokeOpacity="0.45"/>

          {/* ── Mouth interior (dark base) ─────────────────────── */}
          <g data-lc2 style={{ animation: anim('lc2-shake') }}>
            {/* Dark mouth cavity */}
            <ellipse cx="50" cy="67" rx="28" ry="14" fill="#100000"/>
            {/* Inner shadow gradient */}
            <ellipse cx="50" cy="67" rx="26" ry="12"
              fill="none" stroke="#330000" strokeWidth="2" strokeOpacity="0.6"/>

            {/* ── Upper jaw ─────────────────────────────────────── */}
            <g data-lc2 style={{ animation: anim('lc2-upper') }}>
              {/* Upper lip outer shape */}
              <path
                d="M22,66 C26,52 37,47 50,47 C63,47 74,52 78,66
                   C70,60 61,56 50,56 C39,56 30,60 22,66 Z"
                fill="url(#lc2-lip-u)"
              />
              {/* Gum ridge */}
              <rect x="22" y="58.5" width="56" height="2" rx="0.8"
                fill="#991b1b"/>
              {/* Upper teeth */}
              {UPPER_TEETH.map((tx, i) => {
                const fang = i === 1 || i === 7;
                const w = fang ? 3.5 : 4;
                const h = fang ? 11 : 8;
                const ry = fang ? 1.2 : 0.8;
                return (
                  <rect key={tx}
                    x={tx - w / 2} y={60} width={w} height={h} rx={ry}
                    fill="url(#lc2-tooth)"
                  />
                );
              })}
              {/* Fang tips (sharper point) */}
              <polygon points="30.25,71 32.25,71 31.25,73.5"
                fill="#e8e2d6"/>
              <polygon points="67.75,71 69.75,71 68.75,73.5"
                fill="#e8e2d6"/>
            </g>

            {/* ── Lower jaw ─────────────────────────────────────── */}
            <g data-lc2 style={{ animation: anim('lc2-lower') }}>
              {/* Gum ridge */}
              <rect x="24" y="73.5" width="52" height="2" rx="0.8"
                fill="#991b1b"/>
              {/* Lower teeth */}
              {LOWER_TEETH.map((tx) => (
                <rect key={tx}
                  x={tx - 2} y={68.5} width={4} height={6} rx={0.7}
                  fill="url(#lc2-tooth)" fillOpacity="0.9"
                />
              ))}
              {/* Lower lip outer shape */}
              <path
                d="M22,68 C28,80 38,86 50,86 C62,86 72,80 78,68
                   C70,74 61,78 50,78 C39,78 30,74 22,68 Z"
                fill="url(#lc2-lip-l)"
              />
            </g>
          </g>

          {/* ── Chain left ─────────────────────────────────────── */}
          <g
            data-lc2
            style={{ animation: anim('lc2-cl'), transformOrigin: '44px 67px' }}
          >
            {L_CX.map(cx => (
              <Link2 key={cx} cx={cx} cy={CY} leftHalf={true}/>
            ))}
            {/* Chain end cap (broken edge) — flat cut */}
            <rect x="44" y="64.5" width="2" height="5" rx="0.3"
              fill="#333" stroke="#555" strokeWidth="0.5"/>
          </g>

          {/* ── Chain right ────────────────────────────────────── */}
          <g
            data-lc2
            style={{ animation: anim('lc2-cr'), transformOrigin: '56px 67px' }}
          >
            {R_CX.map(cx => (
              <Link2 key={cx} cx={cx} cy={CY} leftHalf={false}/>
            ))}
            {/* Chain end cap */}
            <rect x="54" y="64.5" width="2" height="5" rx="0.3"
              fill="#333" stroke="#555" strokeWidth="0.5"/>
          </g>

          {/* ── Impact flash ───────────────────────────────────── */}
          <rect
            data-lc2
            width="100" height="125"
            fill="url(#lc2-flash-g)"
            style={{ animation: anim('lc2-flash'), opacity: 0 }}
          />

          {/* ── Tagline ────────────────────────────────────────── */}
          <text x="50" y="101" textAnchor="middle"
            fontFamily="'Arial Narrow',Arial,sans-serif"
            fontSize="5" fontWeight="700" letterSpacing="0.5"
            fill="#e8ddd0" fillOpacity="0.65">
            A LÁBIA QUE FAZ
          </text>
          <text x="50" y="108" textAnchor="middle"
            fontFamily="'Arial Narrow',Arial,sans-serif"
            fontSize="5" fontWeight="700" letterSpacing="0.5"
            fill="#e8ddd0" fillOpacity="0.65">
            ELA CORRER ATRÁS
          </text>
          {/* Bottom rule */}
          <line x1="22" y1="111" x2="78" y2="111"
            stroke="#dc2626" strokeWidth="0.35" strokeOpacity="0.4"/>
        </svg>

        {/* ── Spark dots (HTML layer for CSS custom-property direction) ── */}
        {!reduced && SPARKS.map(([dx, dy, color, size, delay], i) => (
          <div
            key={i}
            data-lc2
            aria-hidden="true"
            style={{
              position:     'absolute',
              top:          '54%',   // ~chain height
              left:         '50%',
              width:        size,
              height:       size,
              marginLeft:   -size / 2,
              marginTop:    -size / 2,
              borderRadius: '50%',
              background:   color,
              boxShadow:    `0 0 4px 1px ${color}`,
              ['--sdx' as string]: dx,
              ['--sdy' as string]: dy,
              animation:    `lc2-spark ${DUR} ease-out infinite`,
              animationDelay: `${delay}ms`,
              pointerEvents: 'none',
              willChange:   'transform, opacity',
            }}
          />
        ))}

        {/* ── Hover border intensifier ──────────────────────────── */}
        <div
          aria-hidden="true"
          className="opacity-0 group-hover:opacity-100"
          style={{
            position:   'absolute',
            inset:      0,
            borderRadius: 16,
            border:     '1px solid rgba(220,38,38,0.52)',
            transition: 'opacity 0.3s',
            pointerEvents: 'none',
          }}
        />
      </div>
    </Link>
  );
}
