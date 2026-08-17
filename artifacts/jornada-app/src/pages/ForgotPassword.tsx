import { useState } from 'react';
import { Link } from 'wouter';
import { useAuth }    from '@/context/AuthContext';
import { toAuthError } from '@/lib/authErrors';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();

  const [email,   setEmail]   = useState('');
  const [error,   setError]   = useState('');
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
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

        {sent ? (
          <div className="flex flex-col items-center gap-6 text-center animate-in fade-in duration-500">
            <div className="w-14 h-14 rounded-full bg-[#B266FF]/10 border border-[#B266FF]/20 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B266FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <div>
              <p className="text-white font-serif text-xl mb-2">E-mail enviado</p>
              <p className="text-white/40 text-sm leading-relaxed">
                Verifique sua caixa de entrada e siga as instruções para redefinir a senha.
              </p>
            </div>
            <Link href="/login" className="text-[#B266FF]/80 hover:text-[#B266FF] text-sm transition no-underline">
              Voltar para o login
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-1">
              <p className="text-white/70 text-sm text-center">
                Informe seu e-mail e enviaremos um link para redefinir sua senha.
              </p>
            </div>

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

              {error && (
                <p className="text-sm text-red-400/90 text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#B266FF] hover:bg-[#C47FFF] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm py-3 rounded-lg transition-colors"
              >
                {loading ? 'Enviando…' : 'Enviar link de recuperação'}
              </button>
            </form>

            <p className="text-center text-sm text-white/30">
              <Link href="/login" className="text-[#B266FF]/80 hover:text-[#B266FF] transition no-underline">
                Voltar para o login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
