import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  type User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth }                  from '@/lib/firebase';
import { ensureUserProfile }     from '@/lib/firestoreService';
import { setActiveSyncUid, getActiveSyncUid } from '@/lib/syncStore';
import { flushPendingProgress, cancelPendingProgress } from '@/lib/readerProgress';
import { setWatermarkIdentity }  from '@/lib/watermark';
import { performInitialSync, clearLocalSession } from '@/lib/firestoreSync';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Plano comprado via Cakto — fonte de verdade no backend (cakto_entitlements). */
export type UserPlan = 'essential' | 'deluxe' | null;

/**
 * Estado da consulta do plano ao backend:
 *  - 'loading' → consulta em andamento (não mostrar bloqueio — evita flicker)
 *  - 'ready'   → resposta recebida; `plan` é confiável (inclusive null = sem compra)
 *  - 'error'   → falha técnica (rede/5xx); NÃO tratar como "sem plano"
 */
export type PlanStatus = 'loading' | 'ready' | 'error';

/**
 * Regra central de acesso: Essential e Deluxe têm o MESMO acesso nesta etapa.
 * Diferenciação futura entre planos deve partir daqui (ex.: isDeluxe(plan)).
 */
export function hasPlan(plan: UserPlan): boolean {
  return plan === 'essential' || plan === 'deluxe';
}

interface AuthContextValue {
  user:      User | null;
  /**
   * Plano atual do usuário autenticado, obtido do backend (nunca definido
   * pelo frontend). `null` = sem compra reconhecida ou não autenticado.
   */
  plan:      UserPlan;
  /** Estado da consulta do plano — ver PlanStatus. */
  planStatus: PlanStatus;
  /** Reconsulta o plano no backend (ex.: após compra posterior ou retry). */
  refreshPlan: () => Promise<void>;
  /** True while Firebase is resolving the persisted session on first load. */
  loading:   boolean;
  /**
   * True once the initial Firestore → localStorage sync is complete
   * (or has been skipped for unauthenticated users).
   * Protected routes block on this to guarantee localStorage reflects
   * Firestore before BookReader performs its synchronous reads.
   */
  syncReady: boolean;
  signIn:        (email: string, password: string) => Promise<void>;
  signUp:        (email: string, password: string) => Promise<void>;
  signOut:       () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,      setUser]      = useState<User | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [syncReady, setSyncReady] = useState(false);
  const [plan,       setPlan]       = useState<UserPlan>(null);
  const [planStatus, setPlanStatus] = useState<PlanStatus>('loading');

  // Guarda contra corrida: cada fetch é carimbado; só a consulta mais
  // recente (e da sessão atual) pode gravar o resultado. Evita que uma
  // resposta atrasada de um usuário anterior sobrescreva o plano do atual.
  const planFetchSeq = useRef(0);

  async function fetchPlan(firebaseUser: User): Promise<void> {
    const seq = ++planFetchSeq.current;
    const uid = firebaseUser.uid;
    const commit = (p: UserPlan, s: PlanStatus) => {
      if (seq !== planFetchSeq.current || auth.currentUser?.uid !== uid) return;
      setPlan(p);
      setPlanStatus(s);
    };
    setPlanStatus('loading');
    try {
      const idToken = await firebaseUser.getIdToken();
      const resp = await fetch(`${import.meta.env.BASE_URL}api/me/plan`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!resp.ok) {
        // Falha técnica (5xx etc.) — não é "sem plano"; permite retry.
        commit(null, 'error');
        return;
      }
      const data = (await resp.json()) as { plan?: unknown };
      // Payload malformado ≠ "sem plano": só aceita valores conhecidos.
      if (data.plan === 'essential' || data.plan === 'deluxe' || data.plan === null) {
        commit(data.plan, 'ready');
      } else {
        commit(null, 'error');
      }
    } catch {
      // Backend/rede indisponível — estado de erro, não bloqueio comercial.
      commit(null, 'error');
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Reset syncReady on every auth transition so the spinner shows
      // during Firestore sync on re-login as well as first login.
      setSyncReady(false);

      // Toda transição de auth invalida o plano anterior: nunca herdar o
      // plano de outra sessão/usuário, nem deixar fetches antigos gravarem.
      planFetchSeq.current++;
      setPlan(null);
      setPlanStatus('loading');

      if (!firebaseUser) {
        // Nunca gravar debounce pendente depois que o dono da sessão saiu.
        cancelPendingProgress();
        setActiveSyncUid(null);
        // Evict the localStorage cache immediately so the next user on this
        // device never inherits this session's data — even in the brief window
        // before their own login completes.
        clearLocalSession();
        setUser(null);
        setLoading(false);
        setSyncReady(true); // No user → nothing to sync; let RequireAuth redirect.
        return;
      }

      // 1. Make the user available to the rest of the app immediately.
      setUser(firebaseUser);
      setLoading(false);

      // 2. Activate dual-write so any writes that happen during sync
      //    (unlikely, but safe to guard) also go to Firestore.
      //    Descarta qualquer escrita pendente de uma sessão anterior antes —
      //    debounce do usuário A jamais pode gravar sob o uid do usuário B.
      cancelPendingProgress();
      setActiveSyncUid(firebaseUser.uid);

      // 3. Update the content-protection watermark with the real identity.
      setWatermarkIdentity({
        name:  firebaseUser.displayName
                 ?? firebaseUser.email?.split('@')[0]
                 ?? 'Usuário',
        email: firebaseUser.email ?? '',
      });

      // 3b. Busca o plano comprado (Cakto) no backend — não bloqueia o boot.
      void fetchPlan(firebaseUser);

      // 4. Ensure the Firestore user profile document exists.
      ensureUserProfile(
        firebaseUser.uid,
        firebaseUser.email ?? '',
        firebaseUser.displayName,
      ).catch(() => {});

      // 5. Sync Firestore → localStorage so BookReader's synchronous reads
      //    see the correct, per-user state when it mounts.
      try {
        await performInitialSync(firebaseUser.uid);
      } catch {
        // Firestore temporarily unavailable — fall through to existing
        // localStorage content (could be stale if this is a second device,
        // but the data is not lost and will re-sync on the next login).
      } finally {
        // Só o handler da sessão ATUAL pode liberar as rotas protegidas —
        // um sync atrasado de um usuário anterior não pode marcar pronto
        // enquanto o usuário atual ainda está sincronizando.
        if (getActiveSyncUid() === firebaseUser.uid) setSyncReady(true);
      }
    });

    return unsubscribe;
  }, []);

  async function signIn(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signUp(email: string, password: string): Promise<void> {
    await createUserWithEmailAndPassword(auth, email, password);
  }

  async function signOut(): Promise<void> {
    // AGUARDA o flush do progresso pendente ENQUANTO a sessão ainda é válida —
    // depois do signOut as escritas falhariam sem auth e o cache local é limpo.
    await flushPendingProgress();
    await firebaseSignOut(auth);
  }

  async function resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }

  async function refreshPlan(): Promise<void> {
    if (auth.currentUser) await fetchPlan(auth.currentUser);
  }

  return (
    <AuthContext.Provider value={{ user, plan, planStatus, refreshPlan, loading, syncReady, signIn, signUp, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
