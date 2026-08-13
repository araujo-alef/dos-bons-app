import { Link } from 'wouter';
import communityIconImg from '@assets/image_1786601214929.png';
import mentoriasIconImg from '@assets/image_1786601521796.png';
import iaIconImg from '@assets/image_1786601743895.png';

interface EcosystemCardProps {
  product: {
    id: string;
    name: string;
    available: boolean;
  };
}

export function EcosystemCard({ product }: EcosystemCardProps) {
  const iconMap: Record<string, string> = {
    'comunidade': communityIconImg,
    'mentorias': mentoriasIconImg,
    'ia-conversas': iaIconImg,
  };

  const isIconCard = product.id in iconMap;
  const iconImg = iconMap[product.id];

  const content = isIconCard ? (
    /* ── Icon cards (Comunidade, Mentorias) — object on dark bg ── */
    <div
      className="relative w-full aspect-[4/5] rounded-[14px] overflow-hidden group border border-white/[0.07]"
      style={{ background: '#08070B' }}
      data-testid={`card-product-${product.id}`}
    >
      {/* Faint purple ambient behind icon */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 70% 50% at 50% 40%, rgba(139,53,255,0.10) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Icon — centered object, screen blend removes black bg */}
      <div
        className="absolute inset-x-0 flex items-center justify-center"
        style={{ top: '8%', height: '65%' }}
      >
        <img
          src={iconImg}
          alt={product.name}
          style={{
            width: '58%',
            height: '100%',
            objectFit: 'contain',
            mixBlendMode: 'screen',
            transition: 'opacity 400ms ease',
          }}
          className="opacity-90 group-hover:opacity-100"
        />
      </div>

    </div>
  ) : (
    /* ── Other ecosystem cards — atmospheric background ── */
    <div
      className="relative w-full aspect-[4/5] rounded-[14px] overflow-hidden group border border-white/5"
      data-testid={`card-product-${product.id}`}
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
        style={{ backgroundImage: `url(${images[product.id]})` }}
      />
      <div className="absolute inset-0 bg-[#050505]/55" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/50 to-transparent" />
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
