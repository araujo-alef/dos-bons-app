import { type ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { useAuth, hasPlan } from '@/context/AuthContext';

/**
 * Camada central de controle de acesso visual por plano.
 *
 * Envolve o conteúdo das rotas autenticadas:
 *  - plano essential/deluxe → renderiza o app normalmente (sem overlay);
 *  - plan === null (confirmado pelo backend) → conteúdo visível por trás,
 *    mas coberto por um overlay que bloqueia interação;
 *  - consulta em andamento → nenhum bloqueio (evita flicker);
 *  - erro técnico na consulta → aviso discreto com retry, NUNCA bloqueio.
 *
 * Essential e Deluxe têm o mesmo acesso nesta etapa (ver hasPlan em
 * AuthContext). Diferenciação futura deve partir de lá.
 */
export function PlanGate({ children }: { children: ReactNode }) {
  const { user, plan, planStatus, refreshPlan, signOut } = useAuth();

  // Sem usuário autenticado, o fluxo de login/registro cuida do acesso.
  if (!user) return <>{children}</>;

  // Enquanto o plano carrega, mostra o app sem overlay (sem flicker).
  if (planStatus === 'loading') return <>{children}</>;

  // Falha técnica: não é bloqueio comercial — aviso discreto + retry.
  if (planStatus === 'error') {
    return (
      <>
        {children}
        <div className="fixed bottom-4 inset-x-0 flex justify-center px-4 pointer-events-none" style={{ zIndex: 9990 }}>
          <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-[#111]/90 border border-white/10 px-4 py-2 text-xs text-white/50 backdrop-blur-sm">
            <span>Não foi possível verificar seu acesso.</span>
            <button
              onClick={() => { void refreshPlan(); }}
              className="text-[#B266FF] hover:text-[#c58aff] transition font-medium"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </>
    );
  }

  // Plano confirmado → acesso total, sem qualquer limitação visual.
  if (hasPlan(plan)) return <>{children}</>;

  // Autenticado, backend confirmou: sem plano → overlay de bloqueio.
  return (
    <>
      {/* Conteúdo continua visível por trás, mas não interativo. */}
      <div aria-hidden className="pointer-events-none select-none" inert>
        {children}
      </div>

      <div
        role="dialog"
        aria-label="Acesso bloqueado"
        className="fixed inset-0 flex items-center justify-center px-6"
        // Acima do toaster (z-100) e do BookTransitionOverlay (z-9980):
        // nada do app pode ficar clicável por cima do bloqueio.
        style={{ zIndex: 9990, background: 'rgba(5, 5, 5, 0.55)', backdropFilter: 'blur(2.5px)', WebkitBackdropFilter: 'blur(2.5px)' }}
      >
        <div className="flex flex-col items-center text-center gap-5 max-w-xs rounded-2xl bg-[#0a0a0a]/70 border border-white/[0.06] px-8 py-10">
          <div className="w-12 h-12 rounded-full border border-[#B266FF]/30 flex items-center justify-center">
            <Lock className="w-5 h-5 text-[#B266FF]" strokeWidth={1.5} />
          </div>

          <div className="space-y-2">
            <h2 className="text-white text-lg font-semibold tracking-tight">
              Desbloqueie seu acesso
            </h2>
            <p className="text-white/40 text-sm leading-relaxed">
              Escolha seu plano e libere todo o conteúdo.
            </p>
          </div>

          <button
            onClick={handleViewPlans}
            className="w-full rounded-full bg-[#B266FF] hover:bg-[#a34ffc] transition text-white text-sm font-semibold py-3"
          >
            Adquirir já
          </button>

          <button
            onClick={() => { void signOut(); }}
            className="text-white/25 hover:text-white/50 transition text-xs"
          >
            Sair da conta
          </button>
        </div>
      </div>
    </>
  );
}

/** Ação do CTA "Adquirir já": abre o checkout Cakto em nova aba. */
function handleViewPlans(): void {
  window.open('https://pay.cakto.com.br/k6szn4q_1048490', '_blank', 'noopener');
}
