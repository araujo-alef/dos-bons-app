import { Link } from 'wouter';
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
