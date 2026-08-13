import { Link } from 'wouter';
import type { Chapter } from '@/mocks/data';

interface ChapterCardProps {
  chapter: Chapter;
}

export function ChapterCard({ chapter }: ChapterCardProps) {
  const isUpcoming = chapter.status === 'upcoming';
  
  const content = (
    <div 
      className={`relative w-full rounded-[14px] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border transition-all duration-300 ${
        isUpcoming 
          ? 'bg-transparent border-white/5 opacity-50' 
          : 'bg-[#0C0C0E] border-white/5 hover:border-primary/30 hover:bg-[#111014]'
      }`}
      data-testid={`card-chapter-${chapter.id}`}
    >
      <div className="flex flex-col gap-1 md:gap-2">
        <span className="text-white/40 text-xs font-semibold tracking-widest">
          {isUpcoming ? 'EM BREVE' : `CAPÍTULO ${chapter.number}`}
        </span>
        
        {!isUpcoming && (
          <h3 className="font-serif text-lg md:text-xl text-white/90">
            {chapter.title}
          </h3>
        )}
      </div>

      <div className="flex items-center">
        {chapter.status === 'completed' && (
          <span className="text-[#16A34A] text-xs font-bold tracking-widest flex items-center gap-1">
            <span className="text-[10px]">✓</span> CONCLUÍDO
          </span>
        )}
        {chapter.status === 'inProgress' && (
          <span className="text-primary text-xs font-bold tracking-widest">
            EM ANDAMENTO
          </span>
        )}
        {chapter.status === 'new' && (
          <span className="text-primary-foreground bg-primary px-2 py-1 rounded-sm text-[10px] font-bold tracking-widest">
            NOVO
          </span>
        )}
      </div>
    </div>
  );

  if (isUpcoming) {
    return <div className="py-2">{content}</div>;
  }

  return (
    <Link href={`/jornada/capitulo/${chapter.id}`} className="block py-2 no-underline">
      {content}
    </Link>
  );
}
