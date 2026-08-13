import { AppHeader } from '@/components/AppHeader';
import { JourneyCard } from '@/components/JourneyCard';
import { EcosystemCard } from '@/components/EcosystemCard';
import { ecosystemProducts } from '@/mocks/data';

export default function Home() {
  return (
    <div className="relative min-h-[100dvh] w-full pb-14" style={{ background: '#050505' }}>
      {/* Ambient purple — top only, very subtle */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{ zIndex: 0 }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            background:
              'radial-gradient(ellipse 80% 50% at 60% 0%, rgba(139,53,255,0.10) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="relative" style={{ zIndex: 1 }}>
        <AppHeader />

        <main className="animate-in fade-in duration-700 ease-out px-4 pt-0 pb-4">
          {/* Glowing divider */}
          <div className="relative flex justify-center items-center" style={{ marginBottom: '28px' }}>
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                width: '220px',
                height: '60px',
                background: 'radial-gradient(ellipse at 50% 50%, rgba(139,53,255,0.18) 0%, transparent 70%)',
                filter: 'blur(10px)',
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                width: '100%',
                height: '1px',
                background: 'linear-gradient(to right, transparent, rgba(178,102,255,0.28) 30%, rgba(178,102,255,0.28) 70%, transparent)',
                position: 'relative',
              }}
            />
          </div>
          {/* Unified product grid — Jornada first, then ecosystem */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <JourneyCard />
            {ecosystemProducts.map((product) => (
              <EcosystemCard key={product.id} product={product} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
