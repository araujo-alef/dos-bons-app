import { type ReactNode } from 'react';
import { Redirect } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { PlanGate } from '@/components/PlanGate';

/**
 * Full guard — blocks until Firebase session is resolved AND the initial
 * Firestore → localStorage sync is complete.
 *
 * Use on routes that perform synchronous localStorage reads during mount
 * (e.g. BookReader, Highlights, UpToDate). The sync guarantees those reads
 * see the correct, per-user state rather than a stale previous session.
 *
 * State machine:
 *   loading            → spinner (Firebase resolving persisted session)
 *   !loading && !user  → redirect to /login
 *   user && !syncReady → spinner (Firestore sync in progress)
 *   user && syncReady  → render children ✓
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading, syncReady } = useAuth();

  if (loading || (user && !syncReady)) return <SyncLoadingScreen syncing={!!user} />;
  if (!user) return <Redirect to="/login" />;
  return <PlanGate>{children}</PlanGate>;
}

/**
 * Fast guard — blocks only until Firebase session is resolved.
 * Does NOT wait for the Firestore sync.
 *
 * Use on routes that do not read from localStorage on mount (e.g. Home).
 * This makes those pages accessible immediately after auth without waiting
 * for the Firestore round-trip, which can take 1-3 extra seconds.
 *
 * State machine:
 *   loading           → spinner (Firebase resolving persisted session)
 *   !loading && !user → redirect to /login
 *   user              → render children ✓  (sync may still be in progress)
 */
export function RequireAuthOnly({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <SyncLoadingScreen syncing={false} />;
  if (!user)   return <Redirect to="/login" />;
  return <PlanGate>{children}</PlanGate>;
}

function SyncLoadingScreen({ syncing }: { syncing: boolean }) {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#050505]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-[#B266FF]/30 border-t-[#B266FF] animate-spin" />
        {syncing && (
          <p className="text-white/20 text-xs tracking-widest uppercase animate-pulse">
            Sincronizando
          </p>
        )}
      </div>
    </div>
  );
}
