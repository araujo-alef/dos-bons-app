import { AppHeader } from '@/components/AppHeader';
import { JourneyHero } from '@/components/JourneyHero';
import { EcosystemCard } from '@/components/EcosystemCard';
import { JOURNEY_STATE, CURRENT_CHAPTER_ID, COMPLETED_CHAPTERS } from '@/mocks/config';
import { chapters, ecosystemProducts } from '@/mocks/data';

export default function Home() {
  const currentChapter = chapters.find(c => c.id === CURRENT_CHAPTER_ID);

  return (
    <div className="relative min-h-[100dvh] w-full pb-14" style={{ background: '#050505' }}>
      {/* Subtle ambient background — very dark purple at top */}
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
            height: '70%',
            background:
              'radial-gradient(ellipse 90% 60% at 70% 0%, rgba(139,53,255,0.13) 0%, rgba(139,53,255,0.04) 50%, transparent 75%)',
          }}
        />
      </div>

      <div className="relative" style={{ zIndex: 1 }}>
        <AppHeader />

        <main className="animate-in fade-in duration-700 ease-out">
          {/* Hero — directly after header, no opening phrase */}
          <JourneyHero
            state={JOURNEY_STATE}
            currentChapter={currentChapter}
            completedCount={COMPLETED_CHAPTERS.length}
          />

          {/* Transition zone — ambient glow + short centered rule */}
          <div className="relative flex justify-center items-center" style={{ marginTop: '44px', marginBottom: '44px' }}>
            {/* Purple ambient behind the rule */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                width: '220px',
                height: '60px',
                background: 'radial-gradient(ellipse at 50% 50%, rgba(139,53,255,0.13) 0%, transparent 70%)',
                filter: 'blur(12px)',
                pointerEvents: 'none',
              }}
            />
            {/* Short gradient rule */}
            <div
              style={{
                width: '140px',
                height: '1px',
                background: 'linear-gradient(to right, transparent, rgba(178,102,255,0.22) 30%, rgba(178,102,255,0.22) 70%, transparent)',
                position: 'relative',
              }}
            />
          </div>

          {/* Ecosystem section */}
          <section className="px-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {ecosystemProducts.map((product) => (
                <EcosystemCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
