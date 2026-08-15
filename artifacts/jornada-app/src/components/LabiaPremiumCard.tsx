/**
 * LabiaPremiumCard — Card 2 da Home: "Lábia de Cachorro" apresentado como
 * objeto premium flutuando dentro do card (perspectiva, espessura, sombra,
 * glow vermelho, float idle).
 *
 * Arquitetura de camadas:
 *   Card (fundo escuro, overflow:hidden)
 *   └─ AmbientGlow          (radial vermelho atrás do objeto)
 *   └─ PerspectiveWrapper   (rotateY/X/Z + scale; React-controlled p/ hover)
 *         ├─ DepthEdge      (espessura lateral — offset dark-red)
 *         └─ FloatWrapper   (CSS animation isolada: translateY + micro rotateZ)
 *               └─ FrontFace (imagem + vignette + partículas)
 *   └─ ProjectedShadow      (blob abaixo do objeto)
 */
import { useState, useEffect } from 'react';
import { ChainBreakParticles } from './ChainBreakParticles';
import labiaNovaImg from '@/assets/labia-de-cachorro-nova.png';

// ─── CSS injection ─────────────────────────────────────────────────────────────
const STYLE_ID = 'lpc-css';

function injectCSS() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
/* Float + micro-rotation — aplicado SOMENTE na camada interna,
   para não conflitar com a perspectiva/scale do wrapper externo. */
@keyframes lpc-float {
  0%, 100% { transform: translateY(0px)   rotateZ(-0.3deg); }
  50%       { transform: translateY(-4px)  rotateZ(0.3deg);  }
}

.lpc-float {
  animation: lpc-float 5s ease-in-out infinite;
  will-change: transform;
}

/* Sombra acompanha o float */
@keyframes lpc-shadow {
  0%, 100% { transform: translateX(-50%) scaleX(1);    opacity: 0.7; }
  50%       { transform: translateX(-50%) scaleX(0.88); opacity: 0.45; }
}
.lpc-shadow {
  animation: lpc-shadow 5s ease-in-out infinite;
  will-change: transform, opacity;
}

/* Reduced-motion: remove float, mantém profundidade */
@media (prefers-reduced-motion: reduce) {
  .lpc-float  { animation: none; }
  .lpc-shadow { animation: none; }
}
  `;
  document.head.appendChild(s);
}

// ─── Component ────────────────────────────────────────────────────────────────
export function LabiaPremiumCard() {
  useEffect(() => { injectCSS(); }, []);

  const [hovered, setHovered] = useState(false);

  // Perspectiva + escala controladas por React (hover via state).
  // Float e micro-rotação ficam em camada CSS interna separada.
  const perspectiveTransform = hovered
    ? 'perspective(1000px) rotateY(-6deg) rotateX(2deg) rotateZ(-1deg) translateY(-2px) scale(1.018)'
    : 'perspective(1000px) rotateY(-6deg) rotateX(2deg) rotateZ(-1deg) scale(1)';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width:          '100%',
        height:         '100%',
        borderRadius:   16,
        border:         '1px solid rgba(185,28,28,0.22)',
        background:     '#080607',
        position:       'relative',
        overflow:       'hidden',
        cursor:         'pointer',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
      }}
    >
      {/* ── Ambient glow: reforça profundidade e identidade vermelha ── */}
      <div
        aria-hidden="true"
        style={{
          position:   'absolute',
          inset:      0,
          background: `radial-gradient(ellipse 72% 58% at 50% 52%,
            rgba(185,28,28,${hovered ? '0.20' : '0.13'}) 0%,
            transparent 65%)`,
          pointerEvents: 'none',
          transition:    'background 0.35s ease',
          zIndex:        0,
        }}
      />

      {/* ── Sombra projetada abaixo do objeto ── */}
      <div
        aria-hidden="true"
        className="lpc-shadow"
        style={{
          position:   'absolute',
          bottom:     '3%',
          left:       '50%',
          width:      '72%',
          height:     20,
          background: 'radial-gradient(ellipse 100% 100% at 50% 0%, rgba(40,0,0,0.60) 0%, transparent 100%)',
          filter:     'blur(7px)',
          pointerEvents: 'none',
          zIndex:     1,
        }}
      />

      {/* ── Wrapper de perspectiva (React-controlled: hover scale / lift) ── */}
      <div
        style={{
          width:      '84%',
          aspectRatio:'1122 / 1402',
          position:   'relative',
          transform:   perspectiveTransform,
          transition: 'transform 0.38s cubic-bezier(0.25, 0.1, 0.25, 1)',
          zIndex:     2,
        }}
      >
        {/* Espessura lateral — depth edge (dark red, offset) */}
        <div
          aria-hidden="true"
          style={{
            position:     'absolute',
            inset:        0,
            borderRadius: 8,
            background:   'linear-gradient(150deg, #5c1010 0%, #2e0707 55%, #110202 100%)',
            transform:    'translate(7px, 5px)',
            zIndex:       0,
          }}
        />

        {/* ── Camada de float (CSS animation isolada) ── */}
        <div
          className="lpc-float"
          style={{
            position: 'relative',
            width:    '100%',
            height:   '100%',
            zIndex:   1,
          }}
        >
          {/* ── Face frontal ── */}
          <div
            style={{
              position:   'relative',
              width:      '100%',
              height:     '100%',
              borderRadius: 7,
              overflow:   'hidden',
              border:     '1px solid rgba(185,28,28,0.22)',
              boxShadow:  hovered
                ? '0 16px 38px rgba(0,0,0,0.70), 0 5px 14px rgba(90,0,0,0.32)'
                : '0 10px 28px rgba(0,0,0,0.60), 0 3px 10px rgba(80,0,0,0.22)',
              transition: 'box-shadow 0.38s ease',
            }}
          >
            {/* Imagem principal */}
            <img
              src={labiaNovaImg}
              alt="Lábia de Cachorro — A lábia que faz ela correr atrás"
              style={{
                display:        'block',
                width:          '100%',
                height:         '100%',
                objectFit:      'cover',
                objectPosition: 'center center',
                filter:         hovered ? 'brightness(1.06)' : 'brightness(1)',
                transition:     'filter 0.35s ease',
              }}
            />

            {/* Vignette interna */}
            <div
              aria-hidden="true"
              style={{
                position:      'absolute',
                inset:         0,
                background:    'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 52%, rgba(4,1,1,0.50) 100%)',
                pointerEvents: 'none',
              }}
            />

            {/* Partículas de quebra da corrente */}
            <ChainBreakParticles left="50%" top="54%" />
          </div>
        </div>
      </div>
    </div>
  );
}
