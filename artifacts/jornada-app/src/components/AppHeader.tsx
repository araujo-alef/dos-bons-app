import { Link } from 'wouter';

export function AppHeader() {
  return (
    <header className="flex items-center gap-3 px-6 py-5">
      <Link href="/" className="flex items-center gap-3 no-underline">
        <div className="w-8 h-8 rounded-full bg-[#111014] border border-white/5 flex items-center justify-center">
          <span className="text-primary font-serif font-bold text-lg leading-none italic pr-[1px]">J</span>
        </div>
        <span className="font-serif text-foreground text-sm tracking-wide">
          ECOSSISTEMA
        </span>
      </Link>
    </header>
  );
}
