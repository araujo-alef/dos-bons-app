import { Link } from 'wouter';
import { AppHeader } from '@/components/AppHeader';
import { JourneyCard } from '@/components/JourneyCard';
import chainImg from '@/assets/chain-wide.png';

const COMING_SOON = [
  { label: 'Comunidade', slug: 'comunidade' },
  { label: 'Mentorias',  slug: 'mentorias'  },
  { label: 'IA',         slug: 'ia'         },
];

export default function Home() {
  return (
    <div className="relative min-h-[100dvh] w-full pb-14" style={{ background: '#050505' }}>
      {/* Ambient layers */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '45%',
          background: 'radial-gradient(ellipse 80% 55% at 60% 0%, rgba(139,53,255,0.10) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '65%',
          background: 'radial-gradient(ellipse 90% 60% at 40% 100%, rgba(139,53,255,0.08) 0%, transparent 72%)',
        }} />
      </div>

      <div className="relative" style={{ zIndex: 1 }}>
        <AppHeader />

        {/* Chain separator */}
        <div aria-hidden="true" style={{
          width: '100%', height: '42px', overflow: 'hidden',
          position: 'relative', mixBlendMode: 'screen',
          marginTop: '14px', marginBottom: '32px',
        }}>
          <img src={chainImg} alt="" style={{
            position: 'absolute', width: '100%', height: 'auto',
            top: '50%', transform: 'translateY(-50%)',
          }} />
        </div>

        <main className="animate-in fade-in duration-700 ease-out px-4 pb-4">
          <div className="grid grid-cols-2 gap-4">
            <JourneyCard />

            {COMING_SOON.map(({ label, slug }) => (
              <Link key={slug} href={`/em-breve/${slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{
                  borderRadius:    16,
                  border:          '1px solid rgba(139,53,255,0.22)',
                  background:      'radial-gradient(ellipse 90% 70% at 50% 20%, rgba(139,53,255,0.18) 0%, transparent 70%), #0f0d12',
                  minHeight:       220,
                  height:          '100%',
                  display:         'flex',
                  flexDirection:   'column',
                  alignItems:      'center',
                  justifyContent:  'center',
                  gap:             12,
                  padding:         '24px 16px',
                  cursor:          'pointer',
                }}>
                  {/* Lock icon */}
                  <svg width="26" height="26" viewBox="0 0 24 24"
                    fill="none" stroke="rgba(178,102,255,0.7)" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>

                  <span style={{
                    fontSize: 13, fontWeight: 600,
                    color: 'rgba(255,255,255,0.80)',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                  }}>
                    {label}
                  </span>

                  <span style={{
                    fontSize: 10, fontWeight: 600,
                    color: 'rgba(178,102,255,0.9)',
                    letterSpacing: '0.16em', textTransform: 'uppercase',
                    background: 'rgba(139,53,255,0.15)',
                    border: '1px solid rgba(139,53,255,0.30)',
                    borderRadius: 20, padding: '3px 10px',
                  }}>
                    Em breve
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
