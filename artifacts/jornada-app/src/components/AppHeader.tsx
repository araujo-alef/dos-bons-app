import { Link } from 'wouter';

export function AppHeader() {
  return (
    <header className="flex flex-col items-center justify-center pt-6 pb-3 px-4">
      <Link href="/" className="no-underline text-center">
        <p
          style={{
            color: '#F3F3F3',
            fontSize: '22px',
            fontWeight: 500,
            lineHeight: 1.25,
            letterSpacing: '-0.01em',
            margin: 0,
          }}
        >
          Nem todo cachorro nasceu
          <br />
          pra usar coleira.
        </p>
      </Link>
    </header>
  );
}
