import { Link } from 'wouter';

export function AppHeader() {
  return (
    <header className="flex items-center justify-center py-5">
      <Link href="/" className="no-underline">
        <p
          className="text-center text-xs font-semibold tracking-wide leading-snug"
          style={{ color: '#C0392B', maxWidth: '220px' }}
        >
          Nem todo cachorro nasceu pra usar coleira
        </p>
      </Link>
    </header>
  );
}
