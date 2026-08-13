import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import type { JourneyState } from '@/mocks/config';
import type { Chapter } from '@/mocks/data';
import heroPhoto from '@assets/image_1786597558256.png';

interface JourneyHeroProps {
  state: JourneyState;
  currentChapter?: Chapter;
  completedCount: number;
}

export function JourneyHero({ state, currentChapter, completedCount }: JourneyHeroProps) {
  let label = '';
  let title = '';
  let subtext = '';
  let cta = 'Continuar jornada';
  let showNewBadge = false;

  switch (state) {
    case 'notStarted':
      label = 'COMECE SUA JORNADA';
      title = currentChapter?.title || 'Fundamentos';
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
    <Link href="/jornada" className="block w-full mb-10" data-testid="hero-journey">
      {/* Hero — editorial composition: text left, photo right */}
      <div className="relative w-full overflow-hidden group" style={{ minHeight: '300px' }}>

        {/* Photo — right-aligned, full bleed, no border-radius crop */}
        <div
          className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.02]"
          style={{
            backgroundImage: `url(${heroPhoto})`,
            backgroundSize: 'cover',
            backgroundPosition: 'right center',
            backgroundRepeat: 'no-repeat',
          }}
        />

        {/* Left-to-right fade: solid black on left, transparent toward right */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to right, #050505 0%, #050505 30%, rgba(5,5,5,0.82) 50%, rgba(5,5,5,0.30) 72%, transparent 100%)',
          }}
        />

        {/* Bottom vignette for clean edge */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, #050505 0%, rgba(5,5,5,0.6) 18%, transparent 45%)',
          }}
        />

        {/* Top vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, #050505 0%, transparent 25%)',
          }}
        />

        {/* Text content — left side */}
        <div className="relative z-10 px-6 md:px-10 py-10 md:py-14 flex flex-col justify-center max-w-[62%] md:max-w-[45%]" style={{ minHeight: '300px' }}>
          {showNewBadge && (
            <span
              className="text-[9px] font-bold tracking-[0.2em] text-primary border border-primary/40 px-2 py-1 rounded-sm inline-block mb-4 self-start"
            >
              NOVO CAPÍTULO DISPONÍVEL
            </span>
          )}

          <span className="text-[10px] md:text-[11px] font-bold tracking-[0.18em] text-primary/90 mb-3 block">
            {label}
          </span>

          <h2 className="font-serif text-2xl md:text-[2.2rem] text-white leading-snug mb-3">
            {title}
          </h2>

          {subtext && (
            <span className="text-white/50 text-sm mb-5 block">
              {subtext}
            </span>
          )}

          <div className="flex items-center gap-2 text-white/70 group-hover:text-primary transition-colors duration-300 text-sm font-medium mt-1">
            <span className="group-hover:underline underline-offset-4 decoration-primary/50">{cta}</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </Link>
  );
}
