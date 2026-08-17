/**
 * Firebase Auth → Portuguese error message mapper.
 * Kept in a separate module so AuthContext.tsx exports only React
 * components and hooks — required for Vite Fast Refresh.
 */

const AUTH_ERRORS: Record<string, string> = {
  'auth/user-not-found':         'E-mail não encontrado.',
  'auth/wrong-password':         'Senha incorreta.',
  'auth/invalid-credential':     'E-mail ou senha incorretos.',
  'auth/email-already-in-use':   'Este e-mail já está em uso.',
  'auth/weak-password':          'A senha precisa ter pelo menos 6 caracteres.',
  'auth/invalid-email':          'E-mail inválido.',
  'auth/too-many-requests':      'Muitas tentativas. Tente novamente mais tarde.',
  'auth/network-request-failed': 'Erro de conexão. Verifique sua internet.',
  'auth/operation-not-allowed':  'Este método de login não está ativado. Contate o suporte.',
  'auth/internal-error':         'Erro interno. Tente novamente.',
};

export function toAuthError(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as { code: string }).code;
    // Log the raw code in development so it's visible in browser console.
    if (import.meta.env.DEV) console.error('[auth error code]', code, err);
    return AUTH_ERRORS[code] ?? 'Algo deu errado. Tente novamente.';
  }
  if (import.meta.env.DEV) console.error('[auth error]', err);
  return 'Algo deu errado. Tente novamente.';
}
