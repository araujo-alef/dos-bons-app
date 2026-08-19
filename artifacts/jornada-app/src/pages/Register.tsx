import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth }    from '@/context/AuthContext';
import { toAuthError } from '@/lib/authErrors';
import logoApp from '@/assets/logo-app.jpeg';

export default function Register() {
  const { signUp, user } = useAuth();
  const [, setLocation]  = useLocation();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  if (user) { setLocation('/'); return null; }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      setError('A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    // Mesma normalização usada pelo webhook/backend.
    const normalizedEmail = email.trim().toLowerCase();

    setLoading(true);
    try {
      // O backend é a fonte de verdade: só e-mails com compra Cakto
      // registrada podem criar conta.
      const resp = await fetch(`${import.meta.env.BASE_URL}api/auth/registration-eligibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      if (!resp.ok) {
        setError('Não foi possível verificar sua compra agora. Tente novamente em instantes.');
        return;
      }
      const { eligible } = (await resp.json()) as { eligible: boolean };
      if (!eligible) {
        setError('Não encontramos uma compra vinculada a este e-mail. Use o mesmo e-mail informado no momento da compra.');
        return;
      }

      await signUp(normalizedEmail, password);
      setLocation('/');
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/email-already-in-use') {
        setError('Já existe uma conta com este e-mail. Entre na sua conta para acessar seu conteúdo.');
      } else {
        setError(toAuthError(err));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#050505] px-6">
      <div className="w-full max-w-sm flex flex-col gap-5">

        {/* Logo + tagline (bloco único) */}
        <Link href="/" className="no-underline flex flex-col items-center gap-1">
          <img
            src={logoApp}
            alt="Cachorro dos Bons"
            className="w-32 h-32 rounded-full object-cover"
          />
          <p
            style={{
              fontFamily:    "'Barlow Condensed', sans-serif",
              fontSize:      '28px',
              fontWeight:    400,
              letterSpacing: '0.01em',
              lineHeight:    '1.15',
              color:         '#F2F2F2',
              margin:        0,
              textAlign:     'center',
            }}
          >
            Nem todo cachorro nasceu<br />
            pra usar <span style={{ color: '#B266FF' }}>coleira.</span>
          </p>
        </Link>

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
            <label className="text-xs font-medium tracking-widest text-white/40 uppercase">
              Senha
            </label>
            <input
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder:text-white/20 outline-none focus:border-[#B266FF]/60 focus:ring-1 focus:ring-[#B266FF]/30 transition"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium tracking-widest text-white/40 uppercase">
              Confirmar senha
            </label>
            <input
              type="password"
              autoComplete="new-password"
              required
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm placeholder:text-white/20 outline-none focus:border-[#B266FF]/60 focus:ring-1 focus:ring-[#B266FF]/30 transition"
              placeholder="Repita a senha"
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
            {loading ? 'Criando conta…' : 'Criar conta'}
          </button>
        </form>

        <p className="text-center text-sm text-white/30">
          Já tem conta?{' '}
          <Link href="/login" className="text-[#B266FF]/80 hover:text-[#B266FF] transition no-underline">
            Entrar
          </Link>
        </p>

        {/* Suporte */}
        <div className="flex flex-col items-center gap-2 pt-2 border-t border-white/5">
          <p className="text-xs text-white/25 text-center">
            Está com problemas para acessar?
          </p>
          <a
            href="https://chat.whatsapp.com/DprW7TWCFapBrjOazfbP3O"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white/40 hover:text-white/70 transition underline underline-offset-2"
          >
            Entrar no grupo de suporte
          </a>
        </div>

      </div>
    </div>
  );
}
