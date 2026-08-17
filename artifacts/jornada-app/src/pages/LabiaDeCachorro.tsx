/**
 * LabiaDeCachorro — Preview bloqueado do produto "Lábia de Cachorro".
 *
 * Estrutura intencional:
 *   <tela scrollável com 3 imagens>
 *   <overlay fixo cobrindo toda a viewport>
 *
 * Para substituir os assets:
 *   IMAGE 1 → @/assets/labia-produto-imagem-1.{webp|png|jpg}
 *   IMAGE 2 → @/assets/labia-comunidade-print.png  ← já existe
 *   IMAGE 3 → @/assets/labia-produto-imagem-3.{webp|png|jpg}
 *
 * Para habilitar acesso real:
 *   Troque a constante `hasAccess` por uma verificação real de entitlement.
 *   Quando `hasAccess === true`, o overlay some e o conteúdo fica livre.
 *
 * Link do CTA:
 *   Constante CAKTO_URL abaixo.
 */

import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';

// ─── Configuração ─────────────────────────────────────────────────────────────

const CAKTO_URL = 'https://pay.cakto.com.br/xuqc3on_733124';

/**
 * TODO: substituir por verificação real de entitlement.
 * false → overlay aparece (conteúdo bloqueado).
 * true  → overlay some (membro com acesso).
 */
const hasAccess = false;

// ─── Assets ───────────────────────────────────────────────────────────────────
// IMAGE 1 e IMAGE 3 ainda não foram fornecidos — slots marcados abaixo.
// Quando os arquivos forem adicionados, descomente e ajuste o import.

// import img1 from '@/assets/labia-produto-imagem-1.webp';
import img2 from '@/assets/labia-comunidade-print.png';
// import img3 from '@/assets/labia-produto-imagem-3.webp';

// ─── Cadeado semi-aberto ──────────────────────────────────────────────────────

function LockIcon() {
  return (
    <svg
      width="32" height="32" viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(178,102,255,0.95)"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Corpo do cadeado */}
      <rect x="3" y="11" width="18" height="11" rx="2" />
      {/* Anel semi-aberto: lado direito ainda preso, esquerdo já solto */}
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  );
}

// ─── Overlay fixo de bloqueio ─────────────────────────────────────────────────

function LockedOverlay() {
  return (
    <div
      aria-label="Conteúdo bloqueado"
      style={{
        position:             'fixed',
        inset:                0,
        zIndex:               50,
        // Escurece sem esconder — as imagens ficam visíveis por trás
        background:           'rgba(10,10,12,0.58)',
        backdropFilter:       'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
        // pointer-events: none → scroll passa através; imagens não são clicáveis
        // O bloco do CTA define pointer-events: auto para capturar o clique no botão
        pointerEvents:        'none',
        display:              'flex',
        flexDirection:        'column',
        alignItems:           'center',
        justifyContent:       'center',
        // Safe areas
        paddingTop:           'calc(env(safe-area-inset-top, 0px) + 16px)',
        paddingBottom:        'calc(env(safe-area-inset-bottom, 0px) + 24px)',
        paddingLeft:          'env(safe-area-inset-left, 0px)',
        paddingRight:         'env(safe-area-inset-right, 0px)',
      }}
    >
      {/* CTA — captura pointer events; resto do overlay não captura */}
      <div
        style={{
          pointerEvents: 'auto',
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          gap:            20,
          textAlign:      'center',
          padding:        '0 32px',
          maxWidth:       320,
        }}
      >
        {/* Cadeado */}
        <div style={{
          width:          60,
          height:         60,
          borderRadius:   '50%',
          background:     'rgba(139,53,255,0.16)',
          border:         '1px solid rgba(178,102,255,0.30)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
        }}>
          <LockIcon />
        </div>

        {/* Texto principal */}
        <p style={{
          fontSize:      18,
          fontWeight:    700,
          color:         'rgba(255,255,255,0.94)',
          lineHeight:    1.4,
          margin:        0,
          letterSpacing: '-0.01em',
        }}>
          Entre agora e libere a comunidade e todas as aulas.
        </p>

        {/* Texto secundário */}
        <p style={{
          fontSize:   13,
          color:      'rgba(255,255,255,0.42)',
          lineHeight: 1.5,
          margin:     '-8px 0 0',
        }}>
          Conteúdo exclusivo disponível apenas para membros.
        </p>

        {/* Botão CTA */}
        <a
          href={CAKTO_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display:         'block',
            width:           '100%',
            background:      'linear-gradient(135deg, #9B3FFF 0%, #6B1FD9 100%)',
            borderRadius:    14,
            padding:         '15px 28px',
            fontSize:        16,
            fontWeight:      700,
            color:           '#fff',
            textDecoration:  'none',
            letterSpacing:   '0.02em',
            boxShadow:       '0 4px 28px rgba(139,53,255,0.45)',
            textAlign:       'center',
          }}
        >
          Quero acessar
        </a>
      </div>
    </div>
  );
}

// ─── Placeholder visual para imagens ainda não fornecidas ─────────────────────
// Remove isso quando adicionar o asset real.

function ImagePlaceholder({ label }: { label: string }) {
  return (
    <div style={{
      width:           '100%',
      aspectRatio:     '9 / 16',
      borderRadius:    12,
      background:      'linear-gradient(160deg, #0d0510 0%, #07040e 100%)',
      border:          '1px solid rgba(139,53,255,0.14)',
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
    }}>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        {label}
      </span>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function LabiaDeCachorro() {
  return (
    <div style={{ background: '#050505', minHeight: '100dvh', position: 'relative' }}>

      {/* ── Conteúdo scrollável: 3 imagens ───────────────────────────────── */}
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 12px 80px' }}>

        {/* Botão voltar */}
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

        {/* IMAGE 1 — apresentação das aulas */}
        {/* Quando o arquivo estiver pronto: substituir <ImagePlaceholder> por <img src={img1} ... /> */}
        <div style={{ marginBottom: 10 }}>
          <ImagePlaceholder label="imagem 1 — substituir" />
          {/* <img
            src={img1}
            alt="Apresentação das aulas"
            draggable={false}
            style={{ display: 'block', width: '100%', borderRadius: 12, userSelect: 'none' }}
          /> */}
        </div>

        {/* IMAGE 2 — print da comunidade (asset já disponível) */}
        <div style={{ marginBottom: 10 }}>
          <img
            src={img2}
            alt="Prévia da comunidade"
            draggable={false}
            style={{
              display:    'block',
              width:      '100%',
              borderRadius: 12,
              userSelect: 'none',
            }}
          />
        </div>

        {/* IMAGE 3 — segundo print da comunidade */}
        {/* Quando o arquivo estiver pronto: substituir <ImagePlaceholder> por <img src={img3} ... /> */}
        <div>
          <ImagePlaceholder label="imagem 3 — substituir" />
          {/* <img
            src={img3}
            alt="Prévia da comunidade 2"
            draggable={false}
            style={{ display: 'block', width: '100%', borderRadius: 12, userSelect: 'none' }}
          /> */}
        </div>

      </div>

      {/* ── Overlay de bloqueio — fixo sobre toda a viewport ─────────────── */}
      {!hasAccess && <LockedOverlay />}

    </div>
  );
}
