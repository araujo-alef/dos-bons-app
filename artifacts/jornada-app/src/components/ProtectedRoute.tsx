import { type ReactNode } from 'react';
import { Redirect } from 'wouter';
import { useAuth } from '@/context/AuthContext';

/**
 * Renders children only when the user is authenticated AND the initial
 * Firestore → localStorage sync is complete.
 *
 * Blocking on syncReady guarantees that BookReader's synchronous reads
 * (loadAllHighlights, loadProgress) see the correct, per-user state
 * rather than whatever happened to be in localStorage beforehand.
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
  return <>{children}</>;
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
