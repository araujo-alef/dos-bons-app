import { Link } from 'wouter';
import { ArrowRight, Check } from 'lucide-react';

export default function UpToDate() {
  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 bg-[#050505] selection:bg-primary/30 selection:text-white">
      <div className="flex flex-col items-center text-center max-w-md animate-in fade-in zoom-in-95 duration-1000 ease-out fill-mode-both">
        <div className="w-16 h-16 rounded-full bg-[#16A34A]/10 border border-[#16A34A]/20 flex items-center justify-center text-[#16A34A] mb-8">
          <Check className="w-8 h-8" strokeWidth={2.5} />
        </div>
        
        <span className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-[#16A34A] mb-4">
          VOCÊ ESTÁ EM DIA
        </span>
        
        <h1 className="font-serif text-3xl md:text-4xl text-white mb-6 leading-tight">
          Tudo que foi liberado até aqui já faz parte da sua jornada.
        </h1>
        
        <p className="text-white/50 text-[17px] font-serif italic mb-12">
          A próxima etapa está chegando.
        </p>

        <Link 
          href="/jornada" 
          data-testid="link-revisit-chapters"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm font-medium transition-colors group no-underline"
        >
          <span className="group-hover:underline underline-offset-4 decoration-white/30">Revisitar capítulos</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
