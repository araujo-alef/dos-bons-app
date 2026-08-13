import { Link } from 'wouter';
import book3DImg from '@assets/image_1786600341057.png';

export function JourneyCard() {

  return (
    <Link href="/jornada" className="block no-underline">
      <div
        className="relative w-full aspect-[4/5] rounded-[14px] overflow-hidden group border border-white/[0.07]"
        style={{ background: '#08070B' }}
        data-testid="card-product-jornada"
      >
        {/* Subtle purple ambient behind the book */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse 80% 60% at 50% 42%, rgba(139,53,255,0.14) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* 3D book — object floating inside the card, blended so dark bg disappears */}
        <div
          className="absolute inset-x-0"
          style={{ top: '-4%', height: '78%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <img
            src={book3DImg}
            alt="Cachorro dos Bons"
            style={{
              width: '92%',
              height: '100%',
              objectFit: 'contain',
              objectPosition: 'center center',
              mixBlendMode: 'screen',
              transition: 'transform 600ms ease-out',
            }}
            className="group-hover:scale-[1.04]"
          />
        </div>

        {/* Bottom gradient so text stays legible */}
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{
            height: '55%',
            background: 'linear-gradient(to top, #08070B 40%, transparent 100%)',
          }}
        />

        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-3.5 flex flex-col gap-1">
          <span className="text-[9px] font-bold tracking-[0.2em] text-primary/70 leading-none">
            JORNADA
          </span>
          <h3 className="text-white/90 font-sans text-sm font-semibold leading-tight">
            Cachorro dos Bons
          </h3>
        </div>
      </div>
    </Link>
  );
}
