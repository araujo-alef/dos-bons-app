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
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent opacity-90" />

      {/* Content */}
      <div className="absolute inset-0 p-5 flex flex-col justify-end">
        <h3 className="text-foreground font-serif text-xl mb-1">{product.name}</h3>
        
        {product.available ? (
          <div className="flex items-center gap-2 text-white/60 text-sm font-medium transition-colors group-hover:text-primary">
            <span>Conhecer</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        ) : (
          <div className="text-xs font-semibold tracking-wider text-primary mt-1">
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
