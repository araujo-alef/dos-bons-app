import { Link } from 'wouter';
import mascotImg from '@assets/image_1786598262864.png';

export function AppHeader() {
  return (
    <header className="flex items-center justify-center py-5">
      <Link href="/" className="no-underline group">
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
      </Link>
    </header>
  );
}
