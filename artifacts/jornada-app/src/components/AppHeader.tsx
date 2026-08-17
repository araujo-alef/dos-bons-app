import { useState, useRef, useEffect } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/context/AuthContext';

export function AppHeader() {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [menuOpen]);

  const initial = user?.email?.[0]?.toUpperCase() ?? '?';

  return (
    <header className="flex flex-col items-center pt-8 pb-0 px-4 gap-3">

      {/* User avatar + dropdown — centred above the title */}
      {user && (
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="w-8 h-8 rounded-full bg-[#B266FF]/20 border border-[#B266FF]/30 flex items-center justify-center text-[#B266FF] text-xs font-bold hover:bg-[#B266FF]/30 transition-colors focus:outline-none"
            aria-label="Menu do usuário"
          >
            {initial}
          </button>

          {menuOpen && (
            <div className="absolute left-1/2 -translate-x-1/2 top-10 w-52 bg-[#111] border border-white/10 rounded-xl shadow-xl shadow-black/50 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-xs text-white/40 truncate">{user.email}</p>
              </div>
              <button
                onClick={async () => { setMenuOpen(false); await signOut(); }}
                className="w-full text-left px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
              >
                Sair
              </button>
            </div>
          )}
        </div>
      )}

      <Link href="/" className="no-underline text-center">
        <p
          style={{
            fontFamily:    "'Barlow Condensed', sans-serif",
            fontSize:      '28px',
            fontWeight:    400,
            lineHeight:    1.2,
            letterSpacing: '0.01em',
            color:         '#F2F2F2',
            margin:        0,
            maxWidth:      '280px',
            display:       'inline-block',
          }}
        >
          Nem todo cachorro nasceu
          <br />
          pra usar <span style={{ color: '#B266FF' }}>coleira.</span>
        </p>
      </Link>

    </header>
  );
}
