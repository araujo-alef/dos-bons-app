/**
 * ChainBreakParticles — overlay de partículas metálicas no ponto de quebra
 * da corrente. Cores prata/cinza metálico combinando com a corrente da imagem.
 * CSS puro com transform+opacity — zero impacto de performance.
 */
import { useEffect } from 'react';

const STYLE_ID = 'chain-break-particles-css';

function injectCSS() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  // Cada partícula usa --cbdx / --cbdy para direção; animação em loop 2.6 s.
  // As partículas ficam invisíveis a maior parte do loop e disparam em ~40%.
  s.textContent = `
@keyframes cb-particle {
  0%, 36%   { transform: translate(0, 0) scale(1);           opacity: 0;   }
  42%        { opacity: 0.9; }
  70%        { transform: translate(var(--cbdx), var(--cbdy)) scale(0.25); opacity: 0.5; }
  82%, 100%  { transform: translate(var(--cbdx), var(--cbdy)) scale(0);   opacity: 0;   }
}
  `;
  document.head.appendChild(s);
}

// [dx, dy, color, size, delayMs]
const PARTICLES: [string, string, string, number, number][] = [
  ['-38px', '-2px',  '#c8c8c8', 3,    0  ],
  [ '38px', '-2px',  '#c8c8c8', 3,    0  ],
  ['-28px', '-14px', '#a8a8a8', 2.5,  45 ],
  [ '28px', '-14px', '#a8a8a8', 2.5,  45 ],
  ['-44px',  '5px',  '#e0e0e0', 2,    20 ],
  [ '44px',  '5px',  '#e0e0e0', 2,    20 ],
  ['-18px', '-22px', '#b0b0b0', 2,    65 ],
  [ '18px', '-22px', '#b0b0b0', 2,    65 ],
  ['-32px',  '10px', '#d0d0d0', 1.5,  35 ],
  [ '32px',  '10px', '#d0d0d0', 1.5,  35 ],
];

const DUR = '2.6s';

interface Props {
  /** Horizontal % position of chain break centre in the card */
  left?: string;
  /** Vertical % position of chain break centre in the card */
  top?: string;
}

export function ChainBreakParticles({ left = '50%', top = '54%' }: Props) {
  useEffect(() => { injectCSS(); }, []);

  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduced) return null;

  return (
    <>
      {PARTICLES.map(([dx, dy, color, size, delay], i) => (
        <div
          key={i}
          aria-hidden="true"
          style={{
            position:     'absolute',
            top,
            left,
            width:        size,
            height:       size,
            marginLeft:   -(size / 2),
            marginTop:    -(size / 2),
            borderRadius: '50%',
            background:   color,
            boxShadow:    `0 0 3px 1px ${color}88`,
            pointerEvents: 'none',
            ['--cbdx' as string]: dx,
            ['--cbdy' as string]: dy,
            animation:    `cb-particle ${DUR} ease-out infinite`,
            animationDelay: `${delay}ms`,
            willChange:   'transform, opacity',
          }}
        />
      ))}
    </>
  );
}
