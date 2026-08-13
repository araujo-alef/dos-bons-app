import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { chapters } from '@/mocks/data';
import { ChapterHeader } from '@/components/ChapterHeader';
import { ChapterCompletion } from '@/components/ChapterCompletion';
import {
  TextBlock,
  ImageBlock,
  ReflectionBlock,
  PracticeBlock,
  AudioBlock,
  VideoBlock
} from '@/components/ContentBlocks';

export default function Chapter() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [isCompleted, setIsCompleted] = useState(false);

  const chapterId = id ? parseInt(id, 10) : 0;
  const chapter = chapters.find(c => c.id === chapterId);

  // Reset completion state when navigating to a new chapter
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

  // Se for o próximo capítulo (que não tem conteúdo real ainda)
  if (chapter.status === 'upcoming') {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center text-center px-6">
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

  const handleComplete = () => {
    setIsCompleted(true);
  };

  const handleNext = () => {
    // Determine where to go next
    const nextChapter = chapters.find(c => c.id === chapterId + 1);
    
    if (nextChapter && nextChapter.status !== 'upcoming') {
      setLocation(`/jornada/capitulo/${nextChapter.id}`);
    } else {
      setLocation('/jornada/em-dia');
    }
  };

  return (
    <div className="min-h-[100dvh] w-full pb-24 selection:bg-primary/30 selection:text-white">
      {isCompleted && <ChapterCompletion onNext={handleNext} />}
      
      <ChapterHeader chapter={chapter} />

      <main className="max-w-[680px] mx-auto px-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-both">
        <div className="flex flex-col">
          {chapter.blocks?.map((block, idx) => {
            switch (block.type) {
              case 'text':
                return <TextBlock key={idx} content={block.content} />;
              case 'image':
                return <ImageBlock key={idx} src={block.src} alt={block.alt} />;
              case 'reflection':
                return <ReflectionBlock key={idx} question={block.question} />;
              case 'practice':
                return <PracticeBlock key={idx} instruction={block.instruction} />;
              case 'audio':
                return <AudioBlock key={idx} title={block.title} duration={block.duration} />;
              case 'video':
                return <VideoBlock key={idx} title={block.title} duration={block.duration} />;
              default:
                return null;
            }
          })}
        </div>

        <div className="mt-24 flex flex-col items-center">
          <div className="w-12 h-[1px] bg-white/10 mb-12"></div>
          
          <span className="text-white/30 text-sm font-serif italic mb-8">
            Fim do capítulo
          </span>

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
