import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth, toAuthError } from '@/context/AuthContext';

export default function Login() {
  const { signIn, user } = useAuth();
  const [, setLocation]  = useLocation();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  // Already logged in → go home
  if (user) { setLocation('/'); return null; }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      setLocation('/');
    } catch (err) {
      setError(toAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#050505] px-6">
      <div className="w-full max-w-sm flex flex-col gap-8">

        {/* Logo */}
        <Link href="/" className="no-underline text-center">
          <p
            style={{
              fontFamily:    "'Barlow Condensed', sans-serif",
              fontSize:      '28px',
              fontWeight:    400,
              letterSpacing: '0.01em',
              color:         '#F2F2F2',
              margin:        0,
            }}
          >
            Nem todo cachorro nasceu<br />
            pra usar <span style={{ color: '#B266FF' }}>coleira.</span>
          </p>
        </Link>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium tracking-widest text-white/40 uppercase">
              E-mail
            </label>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder:text-white/20 outline-none focus:border-[#B266FF]/60 focus:ring-1 focus:ring-[#B266FF]/30 transition"
              placeholder="seu@email.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium tracking-widest text-white/40 uppercase">
                Senha
              </label>
              <Link
                href="/recuperar-senha"
                className="text-xs text-[#B266FF]/70 hover:text-[#B266FF] transition no-underline"
              >
                Esqueci a senha
              </Link>
            </div>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder:text-white/20 outline-none focus:border-[#B266FF]/60 focus:ring-1 focus:ring-[#B266FF]/30 transition"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400/90 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#B266FF] hover:bg-[#C47FFF] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm py-3 rounded-lg transition-colors mt-1"
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-sm text-white/30">
          Ainda não tem conta?{' '}
          <Link href="/cadastro" className="text-[#B266FF]/80 hover:text-[#B266FF] transition no-underline">
            Criar conta
          </Link>
        </p>

      </div>
    </div>
  );
}
