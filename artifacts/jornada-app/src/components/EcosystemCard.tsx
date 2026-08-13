import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';
import communityImg from '@/assets/community.png';
import mentorshipsImg from '@/assets/mentorships.png';
import aiImg from '@/assets/ai-conversations.png';

interface EcosystemCardProps {
  product: {
    id: string;
    name: string;
    available: boolean;
  };
}

export function EcosystemCard({ product }: EcosystemCardProps) {
  const images: Record<string, string> = {
    'comunidade': communityImg,
    'mentorias': mentorshipsImg,
    'ia-conversas': aiImg,
  };

  const imageSrc = images[product.id] || communityImg;

  const content = (
    <div 
      className="relative w-full aspect-[4/5] rounded-[14px] overflow-hidden group border border-white/5"
      data-testid={`card-product-${product.id}`}
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
        style={{ backgroundImage: `url(${imageSrc})` }}
      />
      
      {/* Heavy overlay — cards are atmospheric, not hero-level */}
      <div className="absolute inset-0 bg-[#050505]/55" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/50 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 p-4 flex flex-col justify-end">
        <h3 className="text-white/85 font-sans text-sm font-semibold mb-1 leading-tight">{product.name}</h3>

        {product.available ? (
          <div className="flex items-center gap-1 text-white/35 text-xs font-medium transition-colors duration-300 group-hover:text-primary/80">
            <span>Conhecer</span>
            <ArrowRight className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-0.5" />
          </div>
        ) : (
          <div className="text-[10px] font-bold tracking-[0.18em] text-white/30 mt-0.5">
            EM BREVE
          </div>
        )}
      </div>
    </div>
  );

  if (product.available) {
    return (
      <Link href={`/${product.id}`} className="block no-underline">
        {content}
      </Link>
    );
  }

  return <div>{content}</div>;
}
