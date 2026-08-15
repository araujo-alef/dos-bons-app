/**
 * LabiaCachorroCard — animated product card for "Lábia de Cachorro".
 *
 * Animation strategy:
 *  • Image base: subtle jaw-close via scaleY + translateY keyframes.
 *  • Chain overlay: two thin metallic bars positioned at chain height that
 *    slide apart on "break" — fade in only during the break phase so they
 *    don't fight with the printed chain in the image.
 *  • Impact flash: brief white/red overlay on bite.
 *  • Sparks: 6 small divs that shoot outward from the break point and fade.
 *
 * All animation uses CSS keyframes (transform + opacity) — no canvas, no
 * heavy filters. IntersectionObserver pauses the animation off-screen.
 * prefers-reduced-motion shows only the static image.
 *
 * Loop duration: 3.2 s
 */

import { useEffect, useRef } from 'react';
import { Link } from 'wouter';
import labiaImg from '@/assets/labia-de-cachorro-nova.png';

// Inject keyframes once into the document head.
const STYLE_ID = 'labia-card-keyframes';
function injectKeyframes() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
/* ── jaw / image ──────────────────────────────────────────── */
@keyframes lc-jaw {
  0%,32%      { transform: scale(1)    translateY(0);     }
  42%         { transform: scale(1.008) translateY(1.5px); }
  52%         { transform: scale(1.012) translateY(3px);   }
  58%         { transform: scale(1.008) translateY(2px) rotate(-0.4deg); }
  62%         { transform: scale(1.012) translateY(3px) rotate(0.4deg);  }
  67%         { transform: scale(1.008) translateY(1px);  }
  73%,100%    { transform: scale(1)    translateY(0);     }
}

/* ── impact flash ──────────────────────────────────────────── */
@keyframes lc-flash {
  0%,49%      { opacity: 0; }
  52%         { opacity: 0.35; }
  58%,100%    { opacity: 0; }
}

/* ── chain left half ─────────────────────────────────────── */
@keyframes lc-chain-l {
  0%,46%      { transform: translateX(0);    opacity: 0;   }
  52%         { transform: translateX(-2px); opacity: 0.9; }
  62%         { transform: translateX(-14px);opacity: 0.9; }
  78%         { transform: translateX(-16px);opacity: 0;   }
  80%,100%    { transform: translateX(0);    opacity: 0;   }
}

/* ── chain right half ────────────────────────────────────── */
@keyframes lc-chain-r {
  0%,46%      { transform: translateX(0);   opacity: 0;   }
  52%         { transform: translateX(2px); opacity: 0.9; }
  62%         { transform: translateX(14px);opacity: 0.9; }
  78%         { transform: translateX(16px);opacity: 0;   }
  80%,100%    { transform: translateX(0);   opacity: 0;   }
}

/* ── generic spark (directed via --dx / --dy custom props) ── */
@keyframes lc-spark {
  0%,50%   { transform: translate(0,0) scale(1);   opacity: 0; }
  56%      { opacity: 1; }
  72%      { transform: translate(var(--dx),var(--dy)) scale(0.4); opacity: 0.7; }
  82%,100% { transform: translate(var(--dx),var(--dy)) scale(0);   opacity: 0; }
}
  `;
  document.head.appendChild(s);
}

const DURATION = '3.2s';

// Spark descriptors: [dx, dy, color, size]
const SPARKS: [string, string, string, number][] = [
  ['-16px', '-10px', '#e53e3e', 3],
  ['-10px', '-18px', '#fc8181', 2.5],
  ['16px',  '-10px', '#e53e3e', 3],
  ['10px',  '-18px', '#fc8181', 2.5],
  ['-6px',   '12px', '#fbd38d', 2],
  ['6px',    '12px', '#fbd38d', 2],
];

export function LabiaCachorroCard() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Inject CSS once
  useEffect(() => { injectKeyframes(); }, []);

  // Pause animation when card scrolls off-screen
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const animated = el.querySelectorAll<HTMLElement>('[data-lc-anim]');
    const obs = new IntersectionObserver(
      ([entry]) => {
        const state = entry.isIntersecting ? 'running' : 'paused';
        animated.forEach(n => { n.style.animationPlayState = state; });
      },
      { threshold: 0.05 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Chain height in the artwork: chain runs at ≈55 % from top of card.
  // Chain bar visual: 5 px tall, metallic grey gradient.
  const chainBar = {
    height: 5,
    background: 'linear-gradient(180deg, #b0b0b0 0%, #606060 50%, #909090 100%)',
    borderRadius: 2,
    boxShadow: '0 1px 3px rgba(0,0,0,0.7)',
  };

  return (
    <Link
      href="/em-breve/comunidade"
      style={{ textDecoration: 'none', display: 'block' }}
      className="aspect-[4/5]"
    >
      <div
        ref={containerRef}
        className="group"
        style={{
          borderRadius: 16,
          border: '1px solid rgba(185,28,28,0.22)',
          background: '#080304',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          position: 'relative',
          cursor: 'pointer',
          transition: 'border-color 0.25s',
        }}
      >
        {/* ── Base artwork ──────────────────────────────────────── */}
        <img
          data-lc-anim
          src={labiaImg}
          alt="Lábia de Cachorro — A lábia que faz ela correr atrás"
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center center',
            animation: reducedMotion
              ? 'none'
              : `lc-jaw ${DURATION} ease-in-out infinite`,
            willChange: 'transform',
          }}
        />

        {/* ── Subtle edge vignette ──────────────────────────────── */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 16,
            background:
              'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 55%, rgba(8,3,4,0.55) 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* ── Impact flash ─────────────────────────────────────── */}
        {!reducedMotion && (
          <div
            data-lc-anim
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(ellipse 60% 20% at 50% 55%, rgba(255,180,180,0.55) 0%, rgba(200,30,30,0.18) 60%, transparent 100%)',
              animation: `lc-flash ${DURATION} ease-in-out infinite`,
              pointerEvents: 'none',
              willChange: 'opacity',
            }}
          />
        )}

        {/* ── Chain overlay — centered at chain height (~55 % top) ─ */}
        {!reducedMotion && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '55%',
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 0,
              pointerEvents: 'none',
            }}
          >
            {/* left chain half */}
            <div
              data-lc-anim
              style={{
                ...chainBar,
                width: '42%',
                animation: `lc-chain-l ${DURATION} ease-in-out infinite`,
                transformOrigin: 'right center',
                willChange: 'transform, opacity',
              }}
            />
            {/* 4 px gap at break point */}
            <div style={{ width: 4, flexShrink: 0 }} />
            {/* right chain half */}
            <div
              data-lc-anim
              style={{
                ...chainBar,
                width: '42%',
                animation: `lc-chain-r ${DURATION} ease-in-out infinite`,
                transformOrigin: 'left center',
                willChange: 'transform, opacity',
              }}
            />
          </div>
        )}

        {/* ── Sparks ────────────────────────────────────────────── */}
        {!reducedMotion &&
          SPARKS.map(([dx, dy, color, size], i) => (
            <div
              key={i}
              data-lc-anim
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: '55%',
                left: '50%',
                width: size,
                height: size,
                borderRadius: '50%',
                background: color,
                boxShadow: `0 0 4px 1px ${color}`,
                // CSS custom properties for direction
                ['--dx' as string]: dx,
                ['--dy' as string]: dy,
                animation: `lc-spark ${DURATION} ease-out infinite`,
                animationDelay: `${i * 30}ms`,
                pointerEvents: 'none',
                willChange: 'transform, opacity',
              }}
            />
          ))}

        {/* ── Hover: tighten border colour ──────────────────────── */}
        <div
          aria-hidden="true"
          className="group-hover:opacity-100"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 16,
            border: '1px solid rgba(185,28,28,0.50)',
            opacity: 0,
            transition: 'opacity 0.25s',
            pointerEvents: 'none',
          }}
        />
      </div>
    </Link>
  );
}
