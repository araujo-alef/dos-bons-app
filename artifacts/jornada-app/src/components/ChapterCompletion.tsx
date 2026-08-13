import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ChapterCompletionProps {
  onNext: () => void;
}

export function ChapterCompletion({ onNext }: ChapterCompletionProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      onNext();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onNext]);

  return (
    <div className="fixed inset-0 z-[100] bg-[#050505] flex items-center justify-center p-6">
      <div 
        className={`flex flex-col items-center text-center max-w-md transition-all duration-1000 ease-out transform ${
          mounted ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
        }`}
      >
        <div className="w-20 h-20 rounded-full bg-[#16A34A]/10 border border-[#16A34A]/30 flex items-center justify-center text-[#16A34A] mb-8">
          <Check className="w-10 h-10" strokeWidth={3} />
        </div>
        
        <span className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-[#16A34A] mb-4">
          CAPÍTULO CONCLUÍDO
        </span>
        
        <p className="font-serif text-2xl md:text-3xl text-white/90 italic leading-snug">
          "Você não precisa dominar tudo agora. Só precisa continuar."
        </p>
      </div>
    </div>
  );
}
