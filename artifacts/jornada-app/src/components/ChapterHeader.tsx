import { Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import type { Chapter } from '@/mocks/data';

interface ChapterHeaderProps {
  chapter: Chapter;
}

export function ChapterHeader({ chapter }: ChapterHeaderProps) {
  return (
    <header className="px-6 py-8 md:py-12 max-w-2xl mx-auto w-full flex flex-col gap-6 animate-in fade-in duration-1000 fill-mode-both">
      <Link href="/" className="inline-flex items-center text-white/40 hover:text-white transition-colors w-fit no-underline">
        <ArrowLeft className="w-5 h-5" />
      </Link>
      
      <div className="flex flex-col items-center text-center mt-4">
        <span className="text-white/40 text-xs font-semibold tracking-[0.2em] mb-4">
          CAPÍTULO {chapter.number}
        </span>
        <h1 className="font-serif text-3xl md:text-5xl text-white leading-tight md:leading-tight">
          {chapter.title}
        </h1>
      </div>
      
      <div className="w-8 h-[1px] bg-primary/50 mx-auto mt-6"></div>
    </header>
  );
}
