import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import type { JourneyState } from '@/mocks/config';
import type { Chapter } from '@/mocks/data';
import journeyHeroImg from '@/assets/journey-hero.png';

interface JourneyHeroProps {
  state: JourneyState;
  currentChapter?: Chapter;
  completedCount: number;
}

export function JourneyHero({ state, currentChapter, completedCount }: JourneyHeroProps) {
  // Determine labels and text based on state
  let label = '';
  let title = '';
  let subtext = '';
  let cta = 'Continuar jornada';
  let showNewBadge = false;

  switch (state) {
    case 'notStarted':
      label = 'COMECE SUA JORNADA';
      title = currentChapter?.title || 'O Despertar';
      break;
    case 'newChapterAvailable':
      showNewBadge = true;
      label = 'CONTINUE DE ONDE PAROU';
      title = currentChapter?.title || 'Capítulo Atual';
      subtext = `${completedCount} capítulos concluídos`;
      break;
    case 'inProgress':
      label = 'CONTINUE DE ONDE PAROU';
      title = currentChapter?.title || 'Capítulo Atual';
      subtext = `${completedCount} capítulos concluídos`;
      break;
    case 'upToDate':
      label = 'VOCÊ ESTÁ EM DIA';
      title = 'A próxima etapa está chegando';
      subtext = `${completedCount} capítulos concluídos`;
      break;
  }

  return (
    <Link href="/jornada" className="block w-full px-6 mb-12">
      <div 
        className="relative w-full aspect-[16/9] md:aspect-[21/9] rounded-[20px] overflow-hidden group border border-white/10 hover:border-primary/30 transition-colors duration-500"
        data-testid="hero-journey"
      >
        {/* Background artwork */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 ease-out group-hover:scale-105"
          style={{ backgroundImage: `url(${journeyHeroImg})` }}
        />
        
        {/* Deep elegant overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-80" />
        
        {/* Ambient glow in center-left */}
        <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none opacity-50 group-hover:opacity-80 transition-opacity duration-700" />

        {/* Content */}
        <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-center max-w-[80%] md:max-w-[50%]">
          {showNewBadge && (
            <div className="absolute top-6 left-6 md:top-10 md:left-10 bg-primary text-primary-foreground text-[10px] font-bold tracking-widest px-2 py-1 rounded-sm mb-4 inline-block">
              NOVO CAPÍTULO DISPONÍVEL
            </div>
          )}

          <div className="flex flex-col gap-2 mt-auto md:mt-0">
            <span className="text-[10px] md:text-xs font-semibold tracking-widest text-primary/90">
              {label}
            </span>
            
            <h2 className="font-serif text-2xl md:text-4xl text-white leading-tight">
              {title}
            </h2>

            {subtext && (
              <span className="text-white/60 text-sm md:text-base">
                {subtext}
              </span>
            )}

            <div className="flex items-center gap-2 mt-4 text-white/80 group-hover:text-primary transition-colors text-sm font-medium">
              <span className="group-hover:underline underline-offset-4 decoration-primary/50">{cta}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
