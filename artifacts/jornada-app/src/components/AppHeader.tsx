import { Link } from "wouter";

export function AppHeader() {
  return (
    <header className="flex flex-col items-center justify-center pt-8 pb-0 px-4">
      <Link href="/" className="no-underline text-center">
        <p
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "28px",
            fontWeight: 400,
            lineHeight: 1.2,
            letterSpacing: "0.01em",
            color: "#F2F2F2",
            margin: 0,
            maxWidth: "280px",
          }}
        >
          Nem todo cachorro nasceu
          <br />
          pra usar <span style={{ color: "#B266FF" }}>coleira.</span>
        </p>
      </Link>
    </header>
  );
}
