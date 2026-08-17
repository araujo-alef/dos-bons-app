/**
 * LabiaDeCachorro — Tela de apresentação do produto "Lábia de Cachorro".
 *
 * Estrutura:
 *   1. Hero — mock de videoaulas com notificações de conteúdo novo
 *   2. Prints da comunidade — screenshot real + placeholder elegante
 *   3. Overlay de bloqueio — cadeado semi-aberto, CTA, botão de acesso
 *
 * Para substituir no futuro:
 *   • Imagem principal do hero  → componente <HeroAulas /> abaixo
 *   • Print real da comunidade  → @/assets/labia-comunidade-print.png
 *   • Print 2 (placeholder)     → componente <ComunidadePlaceholder />
 *   • Texto do CTA              → constante CTA_TEXT abaixo
 *   • Link do botão             → constante CAKTO_URL abaixo
 */

import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import comunidadePrint from '@/assets/labia-comunidade-print.png';

// ── Configuração fácil de atualizar ───────────────────────────────────────────

const CAKTO_URL  = 'https://pay.cakto.com.br/xuqc3on_733124';
const CTA_TEXT   = 'Entre agora e libere a comunidade e todas as aulas.';
const CTA_SUBTEXT = 'Conteúdo exclusivo disponível apenas para membros.';
const BTN_LABEL  = 'Quero acessar';

// ── Hero — mock de videoaulas ─────────────────────────────────────────────────

const LESSONS = [
  { label: 'Como dominar qualquer conversa com confiança',  duration: '18 min', isNew: true,  colorIdx: 0 },
  { label: 'Os 3 gatilhos que criam atração instantânea',   duration: '24 min', isNew: false, colorIdx: 1 },
  { label: 'Postura, voz e presença — o trio invisível',    duration: '31 min', isNew: false, colorIdx: 2 },
  { label: 'Como ser o cara mais interessante da sala',     duration: '22 min', isNew: true,  colorIdx: 3 },
];

const THUMB_GRADIENTS = [
  'linear-gradient(135deg, rgba(139,53,255,0.65) 0%, rgba(20,8,40,0.9) 100%)',
  'linear-gradient(135deg, rgba(185,28,28,0.55)  0%, rgba(15,5,5,0.9)  100%)',
  'linear-gradient(135deg, rgba(100,40,200,0.60) 0%, rgba(12,6,30,0.9) 100%)',
  'linear-gradient(135deg, rgba(160,60,255,0.55) 0%, rgba(18,8,36,0.9) 100%)',
];

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="rgba(255,255,255,0.75)">
      <polygon points="3,1 15,8 3,15" />
    </svg>
  );
}

function HeroAulas() {
  return (
    <div style={{
      borderRadius: 20,
      border: '1px solid rgba(139,53,255,0.20)',
      background: 'linear-gradient(170deg, #0e0617 0%, #070410 100%)',
      overflow: 'hidden',
    }}>
      {/* Topo do card */}
      <div style={{ padding: '20px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.20em',
            textTransform: 'uppercase', color: 'rgba(178,102,255,0.65)',
            marginBottom: 4,
          }}>
            Lábia de Cachorro
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,0.92)', lineHeight: 1.2 }}>
            Videoaulas
          </div>
        </div>

        <div style={{
          background: 'rgba(178,102,255,0.15)',
          border: '1px solid rgba(178,102,255,0.30)',
          borderRadius: 20, padding: '5px 12px',
          fontSize: 11, fontWeight: 700, color: '#B266FF',
          letterSpacing: '0.03em',
        }}>
          2 novas aulas
        </div>
      </div>

      {/* Lista de aulas */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {LESSONS.map((l, i) => (
          <div
            key={i}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 20px',
              borderBottom: i < LESSONS.length - 1 ? '1px solid rgba(255,255,255,0.04)' : undefined,
            }}
          >
            {/* Thumbnail */}
            <div style={{
              width: 42, height: 42, flexShrink: 0, borderRadius: 10,
              background: THUMB_GRADIENTS[l.colorIdx],
              border: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <PlayIcon />
            </div>

            {/* Texto */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 12.5, fontWeight: 500,
                color: 'rgba(255,255,255,0.85)',
                lineHeight: 1.35,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {l.label}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)', marginTop: 2 }}>
                {l.duration}
              </div>
            </div>

            {/* Badge ou ponto */}
            {l.isNew ? (
              <div style={{
                flexShrink: 0,
                background: 'rgba(178,102,255,0.18)',
                border: '1px solid rgba(178,102,255,0.35)',
                borderRadius: 12, padding: '3px 8px',
                fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
                textTransform: 'uppercase', color: '#B266FF',
                whiteSpace: 'nowrap',
              }}>
                Nova
              </div>
            ) : (
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(178,102,255,0.28)', flexShrink: 0 }} />
            )}
          </div>
        ))}
      </div>

      {/* Fade inferior */}
      <div style={{
        height: 28,
        background: 'linear-gradient(to bottom, transparent, rgba(7,4,14,0.85))',
      }} />
    </div>
  );
}

// ── Placeholder elegante da comunidade ────────────────────────────────────────

const MOCK_MESSAGES = [
  { avatar: 0, text: 'Cara, apliquei o método e ela respondeu na hora 🔥',   time: '21:03', highlight: true  },
  { avatar: 1, text: 'Quem aqui já usou no Insta? deu resultado?',            time: '21:07', highlight: false },
  { avatar: 2, text: 'Funcionou demais irmão, valeu pelo conteúdo 🙏',        time: '21:09', highlight: false },
];

const AVATAR_COLORS = [
  'linear-gradient(135deg,#7B2FF7,#3d1066)',
  'linear-gradient(135deg,#B91C1C,#5a0a0a)',
  'linear-gradient(135deg,#1D4ED8,#0a1a5a)',
];

function ComunidadePlaceholder() {
  return (
    <div style={{
      borderRadius: 16, overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.08)',
      background: '#101010',
    }}>
      {/* Header do grupo */}
      <div style={{
        padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10,
        background: '#161616',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          background: 'radial-gradient(circle, #8B35FF 0%, #3d1066 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16,
        }}>
          🐶
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
            Lábia de Cachorro 🐶
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)' }}>
            5.380 membros · grupo privado
          </div>
        </div>
        <div style={{
          background: '#B266FF', borderRadius: 10,
          padding: '2px 8px', fontSize: 11, fontWeight: 700, color: '#fff',
        }}>
          12
        </div>
      </div>

      {/* Mensagens */}
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {MOCK_MESSAGES.map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: AVATAR_COLORS[m.avatar],
            }} />
            <div style={{
              background: m.highlight ? 'rgba(139,53,255,0.16)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${m.highlight ? 'rgba(139,53,255,0.28)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: '4px 12px 12px 12px',
              padding: '7px 10px',
              maxWidth: 'calc(100% - 36px)',
            }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.82)', lineHeight: 1.4 }}>
                {m.text}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', marginTop: 3, textAlign: 'right' }}>
                {m.time}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Overlay de bloqueio / gate ────────────────────────────────────────────────

function LockIcon() {
  return (
    <svg
      width="26" height="26" viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(178,102,255,0.9)"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Corpo do cadeado */}
      <rect x="3" y="11" width="18" height="11" rx="2" />
      {/* Anel semi-aberto — lado esquerdo aberto, direito ainda preso */}
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  );
}

function LockOverlay() {
  return (
    <a
      href={CAKTO_URL}
      target="_blank"
      rel="noopener noreferrer"
      style={{ display: 'block', textDecoration: 'none' }}
    >
      <div style={{
        borderRadius: 20,
        border: '1px solid rgba(255,255,255,0.11)',
        background: 'rgba(12,8,22,0.88)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        padding: '28px 24px 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 18, textAlign: 'center',
      }}>
        {/* Ícone */}
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'rgba(139,53,255,0.13)',
          border: '1px solid rgba(178,102,255,0.28)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <LockIcon />
        </div>

        {/* Texto */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{
            fontSize: 16, fontWeight: 600,
            color: 'rgba(255,255,255,0.92)',
            lineHeight: 1.45, margin: 0,
            maxWidth: 260,
          }}>
            {CTA_TEXT}
          </p>
          <p style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.36)',
            lineHeight: 1.5, margin: 0,
          }}>
            {CTA_SUBTEXT}
          </p>
        </div>

        {/* Botão */}
        <div style={{
          width: '100%',
          background: 'linear-gradient(135deg, #9B3FFF 0%, #6B1FD9 100%)',
          borderRadius: 14, padding: '14px 24px',
          fontSize: 15, fontWeight: 700,
          color: '#fff', letterSpacing: '0.02em',
          boxShadow: '0 4px 24px rgba(139,53,255,0.38)',
        }}>
          {BTN_LABEL}
        </div>
      </div>
    </a>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function LabiaDeCachorro() {
  return (
    <div style={{ background: '#050505', minHeight: '100dvh', position: 'relative' }}>

      {/* Glow de fundo — fixo */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
          background:
            'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(139,53,255,0.11) 0%, transparent 68%)',
        }}
      />

      {/* Conteúdo centralizado */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto', padding: '0 0 56px' }}>

        {/* Voltar */}
        <header style={{ padding: '24px 20px 12px' }}>
          <Link
            href="/"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'rgba(255,255,255,0.38)' }}
            className="hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
        </header>

        {/* ── 1. Hero — aulas ─────────────────────────────────────────────── */}
        <section style={{ padding: '0 16px 20px' }}>
          <HeroAulas />
        </section>

        {/* ── 2. Label de seção ─────────────────────────────────────────── */}
        <div style={{ padding: '0 20px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)' }}>
            Comunidade
          </span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
        </div>

        {/* ── 2. Prints da comunidade ─────────────────────────────────────── */}
        <section style={{ padding: '0 16px 0', position: 'relative' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Print 1 — screenshot real */}
            {/* Para substituir: trocar o arquivo @/assets/labia-comunidade-print.png */}
            <div style={{
              borderRadius: 16, overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.08)',
              position: 'relative',
            }}>
              <img
                src={comunidadePrint}
                alt="Prévia da comunidade Lábia de Cachorro"
                style={{ display: 'block', width: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* Print 2 — placeholder elegante */}
            {/* Para substituir: trocar <ComunidadePlaceholder /> por uma <img src="..." /> */}
            <div style={{ position: 'relative' }}>
              <ComunidadePlaceholder />

              {/* Gradiente de fade — cria transição suave para o overlay */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  height: '55%', borderRadius: '0 0 16px 16px',
                  background: 'linear-gradient(to bottom, transparent 0%, rgba(5,5,5,0.96) 100%)',
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>

          {/* ── 3. Overlay de bloqueio ──────────────────────────────────────── */}
          <div style={{ marginTop: 16 }}>
            <LockOverlay />
          </div>
        </section>

      </div>
    </div>
  );
}
