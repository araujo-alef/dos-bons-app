import { Play } from 'lucide-react';

export function TextBlock({ content }: { content: string }) {
  return (
    <p className="text-white/80 text-[17px] leading-relaxed md:leading-[1.8] font-sans font-light tracking-wide my-6">
      {content}
    </p>
  );
}

export function ImageBlock({ src, alt }: { src: string; alt?: string }) {
  return (
    <div className="my-10 w-full">
      <div className="relative w-full aspect-[4/3] rounded-[12px] overflow-hidden border border-white/5">
        <img 
          src={src} 
          alt={alt || "Editorial"} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}

export function ReflectionBlock({ question }: { question: string }) {
  return (
    <div className="my-12 relative p-8 md:p-10 rounded-[16px] bg-[#0C0C0E] border border-white/5 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-50" />
      
      <span className="block text-primary/80 text-[10px] font-bold tracking-[0.2em] mb-6 text-center">
        REFLEXÃO
      </span>
      
      <p className="font-serif italic text-xl md:text-2xl text-white/90 text-center leading-relaxed">
        "{question}"
      </p>

      {/* Placeholder for future interaction */}
      <div className="mt-8 border-b border-white/10 pb-2">
        <p className="text-white/20 text-sm text-center italic">Suas anotações ficam apenas com você...</p>
      </div>
    </div>
  );
}

export function PracticeBlock({ instruction }: { instruction: string }) {
  return (
    <div className="my-12 p-8 border border-primary/20 rounded-[16px] bg-primary/5">
      <span className="block text-primary text-[10px] font-bold tracking-[0.2em] mb-4 text-center">
        PRÁTICA
      </span>
      
      <p className="text-white/90 text-base md:text-lg leading-relaxed text-center font-serif">
        {instruction}
      </p>
    </div>
  );
}

export function AudioBlock({ title, duration }: { title: string; duration: string }) {
  return (
    <div className="my-8 flex items-center gap-4 p-4 rounded-[12px] bg-[#111014] border border-white/5 hover:border-white/10 transition-colors cursor-pointer group">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
        <Play className="w-5 h-5 ml-1" />
      </div>
      
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold tracking-[0.2em] text-white/40">
          ÁUDIO • {duration}
        </span>
        <span className="text-sm text-white/90 font-medium">
          {title}
        </span>
      </div>
    </div>
  );
}

export function VideoBlock({ title, duration }: { title: string; duration: string }) {
  return (
    <div className="my-10 relative w-full aspect-[16/9] rounded-[16px] bg-[#0C0C0E] border border-white/5 overflow-hidden group cursor-pointer flex items-center justify-center">
      {/* Decorative dark background for video placeholder */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
      
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white group-hover:scale-110 group-hover:bg-primary/20 group-hover:border-primary/50 group-hover:text-primary transition-all duration-500">
          <Play className="w-6 h-6 ml-1" fill="currentColor" />
        </div>
        
        <div className="flex flex-col items-center text-center">
          <span className="text-[10px] font-bold tracking-[0.2em] text-white/40 mb-1">
            VÍDEO • {duration}
          </span>
          <span className="text-white/80 font-serif text-lg">
            {title}
          </span>
        </div>
      </div>
    </div>
  );
}
