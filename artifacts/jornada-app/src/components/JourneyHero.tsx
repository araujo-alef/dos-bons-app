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
        className="relative w-full flex flex-row items-stretch rounded-[8px] overflow-hidden group border border-white/[0.06] transition-colors duration-500 hover:border-white/[0.12]"
        style={{
          background:
            'radial-gradient(ellipse 100% 120% at 60% 50%, rgba(139,53,255,0.07) 0%, transparent 65%), #0C0C0E',
          minHeight: '190px',
        }}
      >
        {/* ─── LEFT: Book cover — flush to all edges ─── */}
        <div
          className="relative flex-shrink-0"
          style={{ width: '38%', maxWidth: '150px' }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${bookSpreadImg})`,
              backgroundSize: '210% auto',
              backgroundPosition: 'right center',
              backgroundRepeat: 'no-repeat',
              transition: 'transform 600ms ease-out',
            }}
            className="group-hover:scale-[1.03]"
          />
          {/* Right-side fade so cover blends into the dark background */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(to right, transparent 55%, #0C0C0E 100%)',
            }}
          />
        </div>

        {/* ─── RIGHT: Text content — three clear visual groups ─── */}
        <div className="flex flex-col flex-1 min-w-0 justify-center" style={{ gap: 0, padding: '22px 18px 22px 12px' }}>

          {/* GROUP 1 — Context label (small, purple, top) */}
          <div style={{ marginBottom: '10px' }}>
            {showNewBadge && (
              <span className="text-[9px] font-bold tracking-[0.2em] text-primary border border-primary/30 px-2 py-0.5 rounded-sm inline-block mb-2">
                NOVO CAPÍTULO
              </span>
            )}
            <p className="text-[9px] font-bold tracking-[0.22em] text-primary/75 leading-none m-0">
              {label}
            </p>
          </div>

          {/* GROUP 2 — Chapter title (dominant, breathes top & bottom) */}
          <div style={{ marginBottom: '14px' }}>
            <h2
              className="font-serif text-white leading-tight m-0"
              style={{ fontSize: 'clamp(1.05rem, 4.2vw, 1.65rem)' }}
            >
              {title}
            </h2>
          </div>

          {/* GROUP 3 — Status + CTA (secondary, closer together) */}
          <div className="flex flex-col" style={{ gap: '6px' }}>
            {subtext && (
              <span className="text-white/35 leading-none" style={{ fontSize: '11px' }}>
                {subtext}
              </span>
            )}
            <div className="flex items-center gap-1 text-white/80 group-hover:text-primary transition-colors duration-300 font-medium" style={{ fontSize: '12px' }}>
              <span className="group-hover:underline underline-offset-4 decoration-primary/40">
                {cta}
              </span>
              <ArrowRight className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-0.5" />
            </div>
          </div>

        </div>
      </div>
    </Link>
  );
}
