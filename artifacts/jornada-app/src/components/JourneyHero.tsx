import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import type { JourneyState } from '@/mocks/config';
import type { Chapter } from '@/mocks/data';
// Full spread image — we'll crop to show only the front cover (right half)
import bookSpreadImg from '@assets/image_1786597575668.png';

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
    <Link href="/jornada" className="block w-full px-4 md:px-6 mb-8" data-testid="hero-journey">
      <div
        className="relative w-full flex flex-row items-center gap-5 md:gap-8 rounded-[16px] overflow-hidden group border border-white/[0.06] transition-colors duration-500 hover:border-white/[0.12]"
        style={{
          background:
            'radial-gradient(ellipse 100% 120% at 60% 50%, rgba(139,53,255,0.07) 0%, transparent 65%), #0C0C0E',
          padding: '24px 20px',
          minHeight: '180px',
        }}
      >
        {/* ─── LEFT: Book cover (front only, cropped from spread) ─── */}
        <div
          className="relative flex-shrink-0 self-center"
          style={{ width: '36%', maxWidth: '140px' }}
        >
          {/* Shadow depth */}
          <div
            className="absolute inset-0 rounded-[6px] pointer-events-none"
            style={{
              boxShadow:
                '0 8px 32px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.5), 4px 0 12px rgba(139,53,255,0.12)',
              zIndex: 1,
            }}
          />
          {/* Front cover — crop right half of the spread image */}
          <div
            className="w-full rounded-[6px] overflow-hidden"
            style={{
              aspectRatio: '2 / 3',
              position: 'relative',
              zIndex: 2,
            }}
          >
            <div
              style={{
                position: 'absolute',
                /* The spread is ~2:1 landscape. Front cover = right half.
                   We double the width and anchor right so only the front shows. */
                inset: 0,
                backgroundImage: `url(${bookSpreadImg})`,
                backgroundSize: '210% auto',
                backgroundPosition: 'right center',
                backgroundRepeat: 'no-repeat',
                transition: 'transform 600ms ease-out',
              }}
              className="group-hover:scale-[1.03]"
            />
          </div>
        </div>

        {/* ─── RIGHT: Text content ─── */}
        <div className="flex flex-col justify-center gap-2 flex-1 min-w-0">
          {showNewBadge && (
            <span
              className="text-[9px] font-bold tracking-[0.2em] text-primary border border-primary/30 px-2 py-0.5 rounded-sm inline-block self-start mb-1"
            >
              NOVO CAPÍTULO
            </span>
          )}

          <span className="text-[9px] md:text-[10px] font-bold tracking-[0.2em] text-primary/80 leading-none">
            {label}
          </span>

          <h2
            className="font-serif text-white leading-snug"
            style={{ fontSize: 'clamp(1.1rem, 4.5vw, 1.75rem)' }}
          >
            {title}
          </h2>

          {subtext && (
            <span className="text-white/45 text-xs md:text-sm leading-none">
              {subtext}
            </span>
          )}

          <div className="flex items-center gap-1.5 text-white/55 group-hover:text-primary/90 transition-colors duration-300 text-xs md:text-sm font-medium mt-2">
            <span className="group-hover:underline underline-offset-4 decoration-primary/40">
              {cta}
            </span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
