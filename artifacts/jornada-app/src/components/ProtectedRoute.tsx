import { type ReactNode } from 'react';
import { Redirect } from 'wouter';
import { useAuth } from '@/context/AuthContext';

/**
 * Renders children only when the user is authenticated.
 * Shows a minimal loading screen while Firebase resolves the persisted
 * session (first paint), then redirects to /login if unauthenticated.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <AuthLoadingScreen />;
  if (!user)   return <Redirect to="/login" />;
  return <>{children}</>;
}

function AuthLoadingScreen() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#050505]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-[#B266FF]/30 border-t-[#B266FF] animate-spin" />
      </div>
    </div>
  );
}
