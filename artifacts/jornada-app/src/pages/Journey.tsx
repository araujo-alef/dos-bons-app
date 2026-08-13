import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { FeaturedChapterCard } from '@/components/FeaturedChapterCard';
import { ChapterCard } from '@/components/ChapterCard';
import { JOURNEY_STATE, CURRENT_CHAPTER_ID, COMPLETED_CHAPTERS } from '@/mocks/config';
import { chapters } from '@/mocks/data';

export default function Journey() {
  const isUpToDate = JOURNEY_STATE === 'upToDate';
  const currentChapter = chapters.find(c => c.id === CURRENT_CHAPTER_ID);
  
  return (
    <div className="min-h-[100dvh] w-full pb-16">
      {/* Top Header */}
      <header className="px-6 py-6 sticky top-0 z-50 bg-[#050505]/90 backdrop-blur-md border-b border-white/5">
        <Link href="/" className="inline-flex items-center text-white/60 hover:text-white mb-6 transition-colors no-underline">
          <ArrowLeft className="w-5 h-5 mr-2" />
        </Link>
        
        <div className="flex flex-col gap-1">
          <h1 className="font-serif text-3xl text-white">Sua Jornada</h1>
          <p className="text-sm text-white/50">
            {COMPLETED_CHAPTERS.length} capítulos concluídos
            {!isUpToDate && currentChapter && ` • Atual: ${currentChapter.title}`}
          </p>
        </div>
      </header>

      <main className="px-6 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out fill-mode-both">
        <FeaturedChapterCard chapter={currentChapter} isUpToDate={isUpToDate} />

        <div className="flex items-center justify-end mb-6">
          <Link href="/jornada" className="text-white/50 hover:text-primary transition-colors text-sm underline underline-offset-4 decoration-white/20 hover:decoration-primary/50" data-testid="link-notes">
            Meus destaques e anotações →
          </Link>
        </div>

        <div className="flex flex-col">
          {chapters.map((chapter) => (
            <ChapterCard key={chapter.id} chapter={chapter} />
          ))}
        </div>
      </main>
    </div>
  );
}
