import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { lessons } from '@/mocks/data';
import { BookReader } from '@/components/BookReader';
import { clearAllProgress } from '@/lib/readerProgress';
import { LessonHeader } from '@/components/LessonHeader';
import {
  TextBlock,
  ImageBlock,
  ReflectionBlock,
  PracticeBlock,
  AudioBlock,
  VideoBlock,
} from '@/components/ContentBlocks';

export default function LessonPage() {
  const { id } = useParams();
  const [, setLocation] = useLocation();

  // Cream bridge overlay — set by BookTransitionOverlay before navigating here.
  // Starts opaque cream (matching the expanded inner page), fades out on mount
  // so the reader materialises seamlessly from the cream fill.
  const [showBridge] = useState(() => {
    const flag = sessionStorage.getItem('bookEntryTransition');
    if (flag) sessionStorage.removeItem('bookEntryTransition');
    return flag === '1';
  });
  const [bridgeFading, setBridgeFading] = useState(false);

  useEffect(() => {
    if (!showBridge) return;
    const r1 = requestAnimationFrame(() => {
      const r2 = requestAnimationFrame(() => setBridgeFading(true));
      return () => cancelAnimationFrame(r2);
    });
    return () => cancelAnimationFrame(r1);
  }, [showBridge]);

  // Keeps the URL's :id in sync as BookReader crosses lesson boundaries
  // internally — replace (not push) so it never adds back-button stops,
  // and it never remounts BookReader (no key tied to this route param).
  // Purely so a hard reload lands on the right lesson instead of back at
  // whichever one the book was originally opened from.
  const handleLessonChange = useCallback((newLessonId: number) => {
    setLocation(`/jornada/licao/${newLessonId}`, { replace: true });
  }, [setLocation]);

  // "Ver destaques" — navigates to the standalone highlights page, carrying
  // which lesson to return to via ?from=.
  const handleOpenHighlights = useCallback((currentLessonId: number) => {
    setLocation(`/jornada/destaques?from=${currentLessonId}`);
  }, [setLocation]);

  const lessonId = id ? parseInt(id, 10) : 0;
  const lesson = lessons.find(l => l.id === lessonId);

  if (!lesson) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center text-white/50">
        Lição não encontrada.
      </div>
    );
  }

  if (lesson.status === 'upcoming') {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center text-center px-6" style={{ background: '#050505' }}>
        <h1 className="font-serif text-3xl text-white mb-4">Em breve</h1>
        <p className="text-white/60">Esta lição ainda não está disponível.</p>
        <button
          onClick={() => setLocation('/jornada')}
          className="mt-8 text-primary hover:underline underline-offset-4"
        >
          Voltar para a jornada
        </button>
      </div>
    );
  }

  // Only used by the legacy scroll reader below (lessons with just `blocks`,
  // no `pages` — currently unused by any real lesson). The paginated
  // BookReader path handles lesson-to-lesson advancement entirely on its
  // own; see onFinishBook below, which only fires at the very end of the
  // whole book.
  const handleLegacyNext = () => {
    const nextLesson = lessons.find(l => l.id === lessonId + 1);
    if (nextLesson && nextLesson.status !== 'upcoming') {
      setLocation(`/jornada/licao/${nextLesson.id}`);
    } else {
      setLocation('/jornada/em-dia');
    }
  };

  // ─── Book Reader (lessons with pages) ─────────────────────────────────────
  if (lesson.pages && lesson.pages.length > 0) {
    return (
      <div
        className="flex flex-col"
        style={{ height: '100dvh', background: '#050505', overflow: 'hidden' }}
      >
        {/* Cream bridge — fades out after book-opening transition */}
        {showBridge && (
          <div
            aria-hidden="true"
            style={{
              position:   'fixed', inset: 0,
              zIndex:      9000,
              background: 'linear-gradient(150deg, #f2e9d4 0%, #ece0c4 100%)',
              opacity:     bridgeFading ? 0 : 1,
              transition:  bridgeFading ? 'opacity 180ms ease-out' : 'none',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Book — fills full height. Opens at this lesson, but reads onward
            through every later lesson as one continuous sequence — crossing
            a lesson boundary never remounts this component (BookReader has
            no lesson-keyed remount), it just quietly updates the URL via
            onLessonChange below so a hard reload reopens at the right
            lesson instead of back where the book was first opened. */}
        <BookReader
          initialLessonId={lessonId}
          onFinishBook={() => {
            // Whole book read end-to-end — reset every lesson's saved
            // position so reopening the book starts at page one again,
            // instead of resuming lesson 1 wherever it was left before the
            // reader moved on into later lessons.
            clearAllProgress(lessons.map(l => l.id));
            setLocation('/jornada/em-dia');
          }}
          onBack={() => setLocation('/')}
          onLessonChange={handleLessonChange}
          onOpenHighlights={handleOpenHighlights}
        />
      </div>
    );
  }

  // ─── Legacy scroll reader (lessons without pages) ─────────────────────────
  return (
    <div className="min-h-[100dvh] w-full pb-24 selection:bg-primary/30 selection:text-white" style={{ background: '#050505' }}>

      <LessonHeader lesson={lesson} />

      <main className="max-w-[680px] mx-auto px-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-both">
        <div className="flex flex-col">
          {lesson.blocks?.map((block, idx) => {
            switch (block.type) {
              case 'text':        return <TextBlock key={idx} content={block.content} />;
              case 'image':       return <ImageBlock key={idx} src={block.src} alt={block.alt} />;
              case 'reflection':  return <ReflectionBlock key={idx} question={block.question} />;
              case 'practice':    return <PracticeBlock key={idx} instruction={block.instruction} />;
              case 'audio':       return <AudioBlock key={idx} title={block.title} duration={block.duration} />;
              case 'video':       return <VideoBlock key={idx} title={block.title} duration={block.duration} />;
              default:            return null;
            }
          })}
        </div>

        <div className="mt-24 flex flex-col items-center">
          <div className="w-12 h-[1px] bg-white/10 mb-12" />
          <span className="text-white/30 text-sm font-serif italic mb-8">Fim da lição</span>
          <button
            onClick={handleLegacyNext}
            data-testid="button-complete-lesson"
            className="group relative px-8 py-4 bg-transparent hover:bg-white/5 border border-white/10 hover:border-primary/50 rounded-full transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <span className="relative z-10 text-white/90 text-sm font-medium tracking-wide">
              Concluir lição
            </span>
          </button>
        </div>
      </main>
    </div>
  );
}
