import { Link } from 'wouter';
import chainImg from '@/assets/chain-real.png';

export function AppHeader() {
  return (
    <header className="flex flex-col items-center justify-center py-5 gap-2">
      <Link href="/" className="no-underline flex flex-col items-center gap-2">
        <p className="text-white text-lg font-semibold tracking-wide leading-none">
          Nem todo cachorro nasceu
        </p>
        <div className="chain-anim" style={{ mixBlendMode: 'screen' }}>
          <img
            src={chainImg}
            alt=""
            aria-hidden="true"
            style={{ width: '200px', height: 'auto', display: 'block' }}
          />
        </div>
        <p className="text-white text-lg font-semibold tracking-wide leading-none">
          pra usar coleira
        </p>
      </Link>
    </header>
  );
}
