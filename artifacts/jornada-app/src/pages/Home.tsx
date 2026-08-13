import { AppHeader } from '@/components/AppHeader';
import { JourneyHero } from '@/components/JourneyHero';
import { EcosystemCard } from '@/components/EcosystemCard';
import { JOURNEY_STATE, CURRENT_CHAPTER_ID, COMPLETED_CHAPTERS } from '@/mocks/config';
import { chapters, ecosystemProducts } from '@/mocks/data';

export default function Home() {
  const currentChapter = chapters.find(c => c.id === CURRENT_CHAPTER_ID);

  return (
    <div className="min-h-[100dvh] w-full pb-12">
      <AppHeader />
      
      <main className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out fill-mode-both">
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
