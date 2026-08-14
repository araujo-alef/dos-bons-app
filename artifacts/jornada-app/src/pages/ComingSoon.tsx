import { Link, useParams } from 'wouter';
import { ArrowLeft } from 'lucide-react';

// Label map so the URL slug resolves to a display name
const LABELS: Record<string, string> = {
  comunidade: 'Comunidade',
  mentorias:  'Mentorias',
  ia:         'IA',
};

export default function ComingSoon() {
  const params = useParams<{ slug: string }>();
  const name   = LABELS[params.slug ?? ''] ?? 'Em breve';

  return (
    <div
      className="relative min-h-[100dvh] w-full flex flex-col"
      style={{ background: '#050505' }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '60%',
          background:
            'radial-gradient(ellipse 80% 55% at 50% 0%, rgba(139,53,255,0.14) 0%, transparent 70%)',
        }} />
      </div>

      {/* Back button */}
      <header className="relative z-10 px-5 pt-6 pb-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors no-underline"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </header>

      {/* Content — vertically centred */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 text-center gap-8">
        {/* Lock icon */}
        <div style={{
          width: 72, height: 72,
          borderRadius: '50%',
          background: 'rgba(139,53,255,0.12)',
          border: '1px solid rgba(139,53,255,0.30)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg
            width="30" height="30" viewBox="0 0 24 24"
            fill="none" stroke="rgba(178,102,255,0.8)" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <div className="flex flex-col gap-3">
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(178,102,255,0.85)',
          }}>
            Em breve
          </span>

          <h1 style={{
            fontFamily: 'serif',
            fontSize: 32,
            fontWeight: 400,
            color: 'rgba(255,255,255,0.92)',
            lineHeight: 1.2,
          }}>
            {name}
          </h1>

          <p style={{
            fontSize: 15,
            color: 'rgba(255,255,255,0.42)',
            lineHeight: 1.6,
            maxWidth: 280,
          }}>
            Essa funcionalidade está sendo preparada e chegará em breve para você.
          </p>
        </div>

        {/* Divider */}
        <div style={{
          width: 32, height: 1,
          background: 'rgba(139,53,255,0.4)',
          borderRadius: 1,
        }} />

        <Link
          href="/"
          style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.45)',
            textDecoration: 'none',
            letterSpacing: '0.04em',
          }}
          className="hover:text-white transition-colors"
        >
          ← Voltar ao início
        </Link>
      </main>
    </div>
  );
}
