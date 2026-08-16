/**
 * LabiaPremiumCard — Card 2 da Home: "Lábia de Cachorro".
 *
 * A arte já É um baralho renderizado em 3D, então o card não desenha mais
 * nenhum objeto por baixo dela: a moldura de "livro" que existia aqui
 * (espessura lateral, perspectiva, borda/sombra de capa, vignette) foi
 * removida — ela duplicava a profundidade que a própria imagem traz.
 *
 * Camadas:
 *   Card (fundo escuro, overflow:hidden)
 *   └─ AmbientGlow      (radial vermelho de atmosfera)
 *   └─ FloatWrapper     (translateY + micro rotateZ — CSS anim)
 *         └─ ShakeWrapper (vibração sincronizada com partículas — CSS anim)
 *               └─ ArtBox (imagem + partículas no ponto de ruptura)
 */
import { useState, useEffect } from 'react';
import { ChainBreakParticles } from './ChainBreakParticles';
import labiaNovaImg from '@/assets/labia-baralho-v2.webp';

const STYLE_ID = 'lpc-css';

function injectCSS() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
/* Float + micro-rotation — camada interna, não conflita com perspectiva */
@keyframes lpc-float {
  0%, 100% { transform: translateY(0px)  rotateZ(-0.3deg); }
  50%       { transform: translateY(-4px) rotateZ(0.3deg);  }
}
.lpc-float {
  animation: lpc-float 5s ease-in-out infinite;
  will-change: transform;
}

/* Shake/vibração — 2.6s loop, sincronizado com cb-particle.
   Partículas disparam em 36–44% do loop, shake acontece na mesma janela. */
@keyframes lpc-shake {
  0%,  35%   { transform: translateX(0)       rotate(0deg);    }
  37%        { transform: translateX(-6px)    rotate(-0.7deg); }
  38.5%      { transform: translateX(6px)     rotate(0.7deg);  }
  40%        { transform: translateX(-4px)    rotate(-0.5deg); }
  41.5%      { transform: translateX(4px)     rotate(0.5deg);  }
  43%        { transform: translateX(-1.5px)  rotate(-0.15deg); }
  44%, 100%  { transform: translateX(0)       rotate(0deg);    }
}
.lpc-shake {
  animation: lpc-shake 2.6s linear infinite;
  will-change: transform;
}

/* Reduced-motion: remove animações, mantém a arte estática */
@media (prefers-reduced-motion: reduce) {
  .lpc-float  { animation: none; }
  .lpc-shake  { animation: none; }
}
  `;
  document.head.appendChild(s);
}

export function LabiaPremiumCard() {
  useEffect(() => { injectCSS(); }, []);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%', height: '100%',
        borderRadius: 16,
        border: '1px solid rgba(185,28,28,0.22)',
        background: '#080607',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: `radial-gradient(ellipse 72% 58% at 50% 52%,
            rgba(185,28,28,${hovered ? '0.20' : '0.13'}) 0%, transparent 65%)`,
          pointerEvents: 'none',
          transition: 'background 0.35s ease',
        }}
      />

      {/* Float wrapper */}
      <div
        className="lpc-float"
        style={{ position: 'relative', height: '100%', zIndex: 2 }}
      >
        {/* Shake wrapper — sincronizado com partículas */}
        <div
          className="lpc-shake"
          style={{ position: 'relative', height: '100%' }}
        >
          {/* Caixa da arte.
              aspectRatio casa exatamente com a proporção nativa do arquivo
              (640×960). Isso não é cosmético: com objectFit:'cover', qualquer
              divergência recortaria a arte em silêncio E deslocaria as
              partículas, cujo left/top é percentual DESTA caixa. Casando a
              proporção, porcentagem daqui = porcentagem da imagem. */}
          <div
            style={{
              position: 'relative',
              height: '100%',
              aspectRatio: '640 / 960',
              overflow: 'hidden',
            }}
          >
            <img
              src={labiaNovaImg}
              alt="Lábia de Cachorro — Comunidade + Aulas"
              style={{
                display: 'block', width: '100%', height: '100%',
                objectFit: 'cover', objectPosition: 'center center',
                filter: hovered ? 'brightness(1.06)' : 'brightness(1)',
                transition: 'filter 0.35s ease',
              }}
            />

            {/* Partículas de quebra da corrente.
                Nesta arte o baralho é aberto em leque e a carta da frente
                fica à direita: o estilhaço entre as presas está em
                x≈690/1024, y≈975/1535 — daí 67%/63.5%. */}
            <ChainBreakParticles left="67%" top="63.5%" />
          </div>
        </div>
      </div>

    </div>
  );
}
