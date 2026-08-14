import { useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { chapters } from '@/mocks/data';
import { BookReader } from '@/components/BookReader';
import { ChapterCompletion } from '@/components/ChapterCompletion';
import { ChapterHeader } from '@/components/ChapterHeader';
import {
  TextBlock,
  ImageBlock,
  ReflectionBlock,
  PracticeBlock,
  AudioBlock,
  VideoBlock,
} from '@/components/ContentBlocks';

export default function Chapter() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [isCompleted, setIsCompleted] = useState(false);

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

  const chapterId = id ? parseInt(id, 10) : 0;
  const chapter = chapters.find(c => c.id === chapterId);

  useEffect(() => {
    setIsCompleted(false);
  }, [chapterId]);

  if (!chapter) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center text-white/50">
        Capítulo não encontrado.
      </div>
    );
  }

  if (chapter.status === 'upcoming') {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center text-center px-6" style={{ background: '#050505' }}>
        <h1 className="font-serif text-3xl text-white mb-4">Em breve</h1>
        <p className="text-white/60">Este capítulo ainda não está disponível.</p>
        <button
          onClick={() => setLocation('/jornada')}
          className="mt-8 text-primary hover:underline underline-offset-4"
        >
          Voltar para a jornada
        </button>
      </div>
    );
  }

  const handleComplete = () => setIsCompleted(true);

  const handleNext = () => {
    const nextChapter = chapters.find(c => c.id === chapterId + 1);
    if (nextChapter && nextChapter.status !== 'upcoming') {
      setLocation(`/jornada/capitulo/${nextChapter.id}`);
    } else {
      setLocation('/jornada/em-dia');
    }
  };

  // ─── Book Reader (chapters with pages) ────────────────────────────────────
  if (chapter.pages && chapter.pages.length > 0) {
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
        {isCompleted && <ChapterCompletion onNext={handleNext} />}

        {/* Book — fills full height */}
        <BookReader chapter={chapter} onComplete={handleComplete} onBack={() => setLocation('/')} />
      </div>
    );
  }

  // ─── Legacy scroll reader (chapters without pages) ────────────────────────
  return (
    <div className="min-h-[100dvh] w-full pb-24 selection:bg-primary/30 selection:text-white" style={{ background: '#050505' }}>
      {isCompleted && <ChapterCompletion onNext={handleNext} />}

      <ChapterHeader chapter={chapter} />

      <main className="max-w-[680px] mx-auto px-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-both">
        <div className="flex flex-col">
          {chapter.blocks?.map((block, idx) => {
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
          <span className="text-white/30 text-sm font-serif italic mb-8">Fim do capítulo</span>
          <button
            onClick={handleComplete}
            data-testid="button-complete-chapter"
            className="group relative px-8 py-4 bg-transparent hover:bg-white/5 border border-white/10 hover:border-primary/50 rounded-full transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <span className="relative z-10 text-white/90 text-sm font-medium tracking-wide">
              Concluir capítulo
            </span>
          </button>
        </div>
      </main>
    </div>
  );
}
