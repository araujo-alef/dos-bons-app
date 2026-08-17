/**
 * LabiaDeCachorro — Preview bloqueado do produto "Lábia de Cachorro".
 *
 * Assets usados:
 *   IMAGE 1 → @/assets/labia-produto-imagem-1.png  (preview das aulas)
 *   IMAGE 2 → @/assets/labia-produto-imagem-2.png  ← ainda não fornecido
 *   IMAGE 3 → @/assets/labia-produto-imagem-3.png  (print da comunidade)
 *
 * Para editar o texto do overlay:
 *   → constante OVERLAY_TEXT abaixo
 *
 * Para editar a ação do botão:
 *   → constante CAKTO_URL abaixo
 *
 * Para habilitar acesso real (remover overlay):
 *   → constante hasAccess abaixo (trocar por verificação de entitlement)
 */

import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import img1 from '@/assets/labia-produto-imagem-1.png';
// import img2 from '@/assets/labia-produto-imagem-2.png'; // ainda não fornecido
import img3 from '@/assets/labia-produto-imagem-3.png';

// ── Configuração ──────────────────────────────────────────────────────────────

/** Link do botão CTA. */
const CAKTO_URL = 'https://pay.cakto.com.br/xuqc3on_733124';

/** Texto principal do overlay. */
const OVERLAY_TEXT = 'Entre agora e desbloqueie a comunidade e as aulas.';

/** Texto secundário (menor, discreto). */
const OVERLAY_SUBTEXT = 'Conteúdo exclusivo para membros.';

/** Label do botão. */
const BTN_LABEL = 'Quero acessar';

/**
 * false → overlay aparece (bloqueado).
 * true  → overlay some (membro com acesso).
 * TODO: substituir por verificação real de entitlement.
 */
const hasAccess = false;

// ── Cadeado semi-aberto ───────────────────────────────────────────────────────

function LockIcon() {
  return (
    <svg
      width="30" height="30" viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(178,102,255,0.95)"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      {/* Anel semi-aberto: lado esquerdo solto */}
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  );
}

// ── Overlay fixo de bloqueio ──────────────────────────────────────────────────

function LockedOverlay() {
  return (
    <div
      aria-label="Conteúdo bloqueado"
      style={{
        position:             'fixed',
        inset:                0,
        zIndex:               50,
        background:           'rgba(8,6,12,0.54)',
        backdropFilter:       'blur(2.5px)',
        WebkitBackdropFilter: 'blur(2.5px)',
        /* pointer-events: none → scroll do conteúdo funciona normalmente.
           O bloco do CTA sobrescreve com pointer-events: auto. */
        pointerEvents:        'none',
        display:              'flex',
        alignItems:           'center',
        justifyContent:       'center',
        paddingTop:    'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft:   'env(safe-area-inset-left, 0px)',
        paddingRight:  'env(safe-area-inset-right, 0px)',
      }}
    >
      {/* Bloco central — captura eventos de ponteiro */}
      <div
        style={{
          pointerEvents:  'auto',
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          gap:            18,
          textAlign:      'center',
          padding:        '28px 28px 24px',
          maxWidth:       300,
          borderRadius:   20,
          background:     'rgba(10,7,18,0.72)',
          border:         '1px solid rgba(255,255,255,0.09)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        {/* Cadeado */}
        <div style={{
          width:          54,
          height:         54,
          borderRadius:   '50%',
          background:     'rgba(139,53,255,0.15)',
          border:         '1px solid rgba(178,102,255,0.28)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
        }}>
          <LockIcon />
        </div>

        {/* Texto principal */}
        <p style={{
          fontSize:      17,
          fontWeight:    700,
          color:         'rgba(255,255,255,0.94)',
          lineHeight:    1.4,
          margin:        0,
          letterSpacing: '-0.01em',
        }}>
          {OVERLAY_TEXT}
        </p>

        {/* Texto secundário */}
        <p style={{
          fontSize:   12,
          color:      'rgba(255,255,255,0.38)',
          lineHeight: 1.5,
          margin:     '-6px 0 0',
        }}>
          {OVERLAY_SUBTEXT}
        </p>

        {/* Botão CTA */}
        <a
          href={CAKTO_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display:        'block',
            width:          '100%',
            background:     'linear-gradient(135deg, #9B3FFF 0%, #6B1FD9 100%)',
            borderRadius:   13,
            padding:        '14px 24px',
            fontSize:       15,
            fontWeight:     700,
            color:          '#fff',
            textDecoration: 'none',
            letterSpacing:  '0.02em',
            textAlign:      'center',
            boxShadow:      '0 4px 24px rgba(139,53,255,0.42)',
          }}
        >
          {BTN_LABEL}
        </a>
      </div>
    </div>
  );
}

// ── Slot de imagem ainda não fornecida ────────────────────────────────────────

function ImagePlaceholder() {
  return (
    <div style={{
      width:       '100%',
      aspectRatio: '4 / 3',
      borderRadius: 12,
      background:  'linear-gradient(160deg, #0d0510 0%, #07040e 100%)',
      border:      '1px solid rgba(139,53,255,0.12)',
      display:     'flex',
      alignItems:  'center',
      justifyContent: 'center',
    }}>
      <span style={{
        fontSize:      11,
        color:         'rgba(255,255,255,0.18)',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
      }}>
        imagem em breve
      </span>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function LabiaDeCachorro() {
  return (
    <div style={{ background: '#050505', minHeight: '100dvh', position: 'relative' }}>

      {/* Scrollable — 3 imagens */}
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 12px 80px' }}>

        {/* Voltar */}
        <header style={{ padding: '24px 4px 16px' }}>
          <Link
            href="/"
            style={{
              display:        'inline-flex',
              alignItems:     'center',
              gap:            8,
              textDecoration: 'none',
              color:          'rgba(255,255,255,0.38)',
            }}
            className="hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
        </header>

        {/* IMAGE 1 — preview das aulas */}
        <div style={{ marginBottom: 10 }}>
          <img
            src={img1}
            alt="Preview das aulas — Lábia de Cachorro"
            draggable={false}
            style={{ display: 'block', width: '100%', borderRadius: 12, userSelect: 'none' }}
          />
        </div>

        {/* IMAGE 2 — print da comunidade (ainda não fornecido) */}
        {/* Quando tiver o asset: adicionar arquivo labia-produto-imagem-2.png,
            descomentar o import e substituir <ImagePlaceholder /> por <img src={img2} ... /> */}
        <div style={{ marginBottom: 10 }}>
          <ImagePlaceholder />
        </div>

        {/* IMAGE 3 — segundo print da comunidade */}
        <div>
          <img
            src={img3}
            alt="Comunidade ativa — Lábia de Cachorro"
            draggable={false}
            style={{ display: 'block', width: '100%', borderRadius: 12, userSelect: 'none' }}
          />
        </div>

      </div>

      {/* Overlay fixo — cobre toda a viewport */}
      {!hasAccess && <LockedOverlay />}

    </div>
  );
}
