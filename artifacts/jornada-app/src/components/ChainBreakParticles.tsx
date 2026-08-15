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
  ['-14px', '-1px',  '#c8c8c8', 2.5,  0  ],
  [ '14px', '-1px',  '#c8c8c8', 2.5,  0  ],
  ['-10px', '-7px',  '#a8a8a8', 2,    45 ],
  [ '10px', '-7px',  '#a8a8a8', 2,    45 ],
  ['-17px', ' 3px',  '#e0e0e0', 1.5,  20 ],
  [ '17px', ' 3px',  '#e0e0e0', 1.5,  20 ],
  ['-7px',  '-12px', '#b0b0b0', 1.5,  65 ],
  [ '7px',  '-12px', '#b0b0b0', 1.5,  65 ],
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
