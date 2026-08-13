import { AppHeader } from '@/components/AppHeader';
import { JourneyHero } from '@/components/JourneyHero';
import { EcosystemCard } from '@/components/EcosystemCard';
import { JOURNEY_STATE, CURRENT_CHAPTER_ID, COMPLETED_CHAPTERS } from '@/mocks/config';
import { chapters, ecosystemProducts } from '@/mocks/data';

function HomeBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {/* Primary glow — top-center, behind the hero */}
      <div
        style={{
          position: 'absolute',
          top: '-5%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '120%',
          height: '60%',
          background:
            'radial-gradient(ellipse at 50% 10%, rgba(139, 53, 255, 0.28) 0%, rgba(139, 53, 255, 0.10) 40%, transparent 68%)',
          filter: 'blur(24px)',
        }}
      />
      {/* Secondary glow — lower-left, near Explore section */}
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '-5%',
          width: '70%',
          height: '40%',
          background:
            'radial-gradient(ellipse at 20% 80%, rgba(100, 30, 200, 0.14) 0%, transparent 60%)',
          filter: 'blur(36px)',
        }}
      />
    </div>
  );
}

export default function Home() {
  const currentChapter = chapters.find(c => c.id === CURRENT_CHAPTER_ID);

  return (
    <div className="relative min-h-[100dvh] w-full pb-12" style={{ background: '#050505' }}>
      <HomeBackground />
      <AppHeader />
      
      <main className="relative animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out fill-mode-both" style={{ zIndex: 1 }}>
        <div className="px-6 py-4 mb-4">
          <p className="font-serif text-white/80 text-xl md:text-2xl italic">
            O próximo passo começa aqui.
          </p>
        </div>

        <JourneyHero 
          state={JOURNEY_STATE} 
          currentChapter={currentChapter} 
          completedCount={COMPLETED_CHAPTERS.length} 
        />

        <section className="px-6 mt-16">
          <h2 className="text-white/90 text-sm font-semibold tracking-wider mb-6">
            EXPLORE O ECOSSISTEMA
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {ecosystemProducts.map((product) => (
              <EcosystemCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
