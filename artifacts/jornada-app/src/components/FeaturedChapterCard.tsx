import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import type { Chapter } from '@/mocks/data';

interface FeaturedChapterCardProps {
  chapter?: Chapter;
  isUpToDate: boolean;
}

export function FeaturedChapterCard({ chapter, isUpToDate }: FeaturedChapterCardProps) {
  if (isUpToDate || !chapter) {
    return (
      <div 
        className="w-full bg-[#111014] rounded-[16px] border border-white/5 p-8 flex flex-col items-center justify-center text-center my-8 aspect-[16/9] md:aspect-[21/9]"
        data-testid="card-featured-future"
      >
        <span className="text-xs font-semibold tracking-widest text-primary/80 mb-2">
          PRÓXIMO CAPÍTULO / EM BREVE
        </span>
        <div className="w-16 h-[1px] bg-white/10 mt-4"></div>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full rounded-[16px] overflow-hidden group border border-white/10 my-8 bg-card"
      data-testid={`card-featured-${chapter.id}`}
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[60px] pointer-events-none" />
      
      <div className="p-6 md:p-8 flex flex-col h-full relative z-10">
        <span className="text-[10px] md:text-xs font-bold tracking-widest text-primary mb-3">
          EM ANDAMENTO
        </span>
        
        <span className="text-white/50 text-xs font-semibold tracking-widest mb-1">
          CAPÍTULO {chapter.number}
        </span>
        
        <h2 className="font-serif text-2xl md:text-3xl text-white mb-6">
          {chapter.title}
        </h2>
        
        <Link 
          href={`/jornada/capitulo/${chapter.id}`} 
          className="inline-flex items-center gap-2 text-white bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-2.5 rounded-full text-sm transition-colors w-fit no-underline"
        >
          Continuar <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
