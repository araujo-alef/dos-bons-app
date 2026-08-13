import { Link } from 'wouter';
import mascotImg from '@assets/image_1786598262864.png';

export function AppHeader() {
  return (
    <header className="flex items-center gap-3 px-4 py-5">
      <Link href="/" className="flex items-center gap-3 no-underline group">
        {/* Mascot icon — circular crop, preserves the purple glow edge */}
        <div
          className="relative flex-shrink-0 rounded-full overflow-hidden"
          style={{ width: '50px', height: '50px' }}
        >
          <img
            src={mascotImg}
            alt="Lábia de Cachorro"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center 20%',
              transform: 'scale(1.15)',
            }}
          />
        </div>

        <span
          className="text-white font-sans font-semibold group-hover:text-white/80 transition-colors duration-200"
          style={{ fontSize: '22px', letterSpacing: '-0.02em' }}
        >
          Lábia de Cachorro
        </span>
      </Link>
    </header>
  );
}
