import {
  createContext,
  useContext,
  useEffect,
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
import { auth } from '@/lib/firebase';
import { ensureUserProfile } from '@/lib/firestoreService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user:          User | null;
  /** True while Firebase is resolving the persisted session on first load. */
  loading:       boolean;
  signIn:        (email: string, password: string) => Promise<void>;
  signUp:        (email: string, password: string) => Promise<void>;
  signOut:       () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

// ─── Portuguese error messages ────────────────────────────────────────────────

const AUTH_ERRORS: Record<string, string> = {
  'auth/user-not-found':      'E-mail não encontrado.',
  'auth/wrong-password':      'Senha incorreta.',
  'auth/invalid-credential':  'E-mail ou senha incorretos.',
  'auth/email-already-in-use':'Este e-mail já está em uso.',
  'auth/weak-password':       'A senha precisa ter pelo menos 6 caracteres.',
  'auth/invalid-email':       'E-mail inválido.',
  'auth/too-many-requests':   'Muitas tentativas. Tente novamente mais tarde.',
  'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.',
};

export function toAuthError(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as { code: string }).code;
    return AUTH_ERRORS[code] ?? 'Algo deu errado. Tente novamente.';
  }
  return 'Algo deu errado. Tente novamente.';
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      // Ensure the Firestore profile exists whenever the user is present.
      if (firebaseUser) {
        ensureUserProfile(
          firebaseUser.uid,
          firebaseUser.email ?? '',
          firebaseUser.displayName,
        ).catch(() => {});
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
    await firebaseSignOut(auth);
  }

  async function resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
