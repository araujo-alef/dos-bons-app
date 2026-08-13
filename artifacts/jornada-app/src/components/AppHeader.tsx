import { Link } from 'wouter';
import mascotImg from '@assets/image_1786598262864.png';

export function AppHeader() {
  return (
    <header className="flex items-center gap-3 px-5 py-4">
      <Link href="/" className="flex items-center gap-2.5 no-underline group">
        {/* Mascot icon — circular crop, preserves the purple glow edge */}
        <div
          className="relative flex-shrink-0 rounded-full overflow-hidden"
          style={{ width: '34px', height: '34px' }}
        >
          <img
            src={mascotImg}
            alt="Lábia de Cachorro"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              /* Zoom slightly to trim excess black padding from the source image */
              objectPosition: 'center 20%',
              transform: 'scale(1.15)',
            }}
          />
        </div>

        <span
          className="text-white/90 font-sans text-sm font-medium tracking-[-0.01em] group-hover:text-white transition-colors duration-200"
          style={{ letterSpacing: '-0.01em' }}
        >
          Lábia de Cachorro
        </span>
      </Link>
    </header>
  );
}
