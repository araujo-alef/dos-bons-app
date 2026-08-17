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
import { auth }                  from '@/lib/firebase';
import { ensureUserProfile }     from '@/lib/firestoreService';
import { setActiveSyncUid }      from '@/lib/syncStore';
import { setWatermarkIdentity }  from '@/lib/watermark';
import { performInitialSync, clearLocalSession } from '@/lib/firestoreSync';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user:      User | null;
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // Reset syncReady on every auth transition so the spinner shows
      // during Firestore sync on re-login as well as first login.
      setSyncReady(false);

      if (!firebaseUser) {
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
      setActiveSyncUid(firebaseUser.uid);

      // 3. Update the content-protection watermark with the real identity.
      setWatermarkIdentity({
        name:  firebaseUser.displayName
                 ?? firebaseUser.email?.split('@')[0]
                 ?? 'Usuário',
        email: firebaseUser.email ?? '',
      });

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
        setSyncReady(true);
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
    <AuthContext.Provider value={{ user, loading, syncReady, signIn, signUp, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
