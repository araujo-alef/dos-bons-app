import { AppHeader } from '@/components/AppHeader';
import { JourneyCard } from '@/components/JourneyCard';
import { EcosystemCard } from '@/components/EcosystemCard';
import { ecosystemProducts } from '@/mocks/data';
import chainImg from '@/assets/chain-wide.png';

export default function Home() {
  return (
    <div className="relative min-h-[100dvh] w-full pb-14" style={{ background: '#050505' }}>
      {/* Ambient layers — purple top (brand), wine bottom (products) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={{ zIndex: 0 }}
      >
        {/* Purple — header/brand zone */}
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: '45%',
            background:
              'radial-gradient(ellipse 80% 55% at 60% 0%, rgba(139,53,255,0.10) 0%, transparent 70%)',
          }}
        />
        {/* Wine — products/cards zone, long soft fade */}
        <div
          style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: '65%',
            background:
              'radial-gradient(ellipse 90% 60% at 40% 100%, rgba(140,10,10,0.11) 0%, transparent 72%)',
          }}
        />
      </div>

      <div className="relative" style={{ zIndex: 1 }}>
        {/* Two-line phrase */}
        <AppHeader />

        {/* Chain — brand separator, full bleed edge-to-edge */}
        <div
          aria-hidden="true"
          style={{
            width: '100%',
            height: '42px',
            overflow: 'hidden',
            position: 'relative',
            mixBlendMode: 'screen',
            marginTop: '14px',
            marginBottom: '32px',
          }}
        >
          <img
            src={chainImg}
            alt=""
            style={{
              position: 'absolute',
              width: '100%',
              height: 'auto',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          />
        </div>

        <main className="animate-in fade-in duration-700 ease-out px-4 pb-4">
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
