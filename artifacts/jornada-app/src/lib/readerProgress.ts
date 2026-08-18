/**
 * Reading progress repository.
 *
 * Storage strategy:
 *   • localStorage — written synchronously (keeps the reader instant); cache
 *     do usuário atual, nunca fonte de verdade.
 *   • Firestore    — fonte de verdade; escrita em background com DEBOUNCE
 *     (uma escrita por pausa de navegação, não por virada de página).
 *
 * Progress anchors to the ORIGINAL authored (pageId, blockIdx) of the first
 * block the reader was looking at — not a page index. Page indices are
 * recomputed per device (see src/lib/pagination.ts), so persisting one
 * directly would resume a phone's position on a tablet's completely
 * different page layout. blockIdx -1 means "the lesson's cover".
 *
 * Conflito entre dispositivos: cada gravação carrega `updatedAt` (epoch ms).
 * O Firestore só aceita a escrita se ela for mais nova que a existente
 * (last-write-wins por timestamp — ver saveProgressRemote), e a restauração
 * no login compara timestamps por lição (ver firestoreSync.ts).
 *
 * Migration / initial restore is handled by src/lib/firestoreSync.ts,
 * which pre-populates localStorage from Firestore before any protected
 * route becomes accessible.
 */

import { getActiveSyncUid } from '@/lib/syncStore';
import { saveProgressRemote, clearAllProgressRemote } from '@/lib/firestoreService';

export interface ProgressAnchor {
  pageId:   number;
  blockIdx: number;
}

/** Anchor + carimbo de quando foi gravado (epoch ms) — para LWW. */
export interface StoredProgress extends ProgressAnchor {
  updatedAt?: number;
}

const PREFIX   = 'jornada_progress_lesson';
const localKey = (lessonId: number) => `${PREFIX}${lessonId}`;

// ── localStorage primitives ──────────────────────────────────────────────────

function writeLocalProgress(lessonId: number, stored: StoredProgress): void {
  try { localStorage.setItem(localKey(lessonId), JSON.stringify(stored)); } catch {}
}

// ── Debounced Firestore writes ───────────────────────────────────────────────
// Uma virada de página por segundo NÃO deve gerar uma escrita por página.
// Acumulamos a posição mais recente por lição e gravamos após uma pausa.

const REMOTE_DEBOUNCE_MS = 2_000;

const pendingRemote = new Map<number, StoredProgress>();
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleRemoteWrite(lessonId: number, stored: StoredProgress): void {
  pendingRemote.set(lessonId, stored);
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => { void flushPendingProgress(); }, REMOTE_DEBOUNCE_MS);
}

/**
 * Grava imediatamente tudo que está pendente no Firestore.
 * Chamado ao sair do leitor, no logout e em pagehide/aba oculta.
 *
 * Retorna uma promise que resolve quando as escritas terminam (ou falham) —
 * o logout AGUARDA esse retorno antes de invalidar a sessão Firebase, senão
 * as transações rodariam já sem autenticação e o progresso pendente se
 * perderia junto com o cache local limpo no sign-out.
 * Nunca lança — falhas ficam no localStorage e re-sincronizam depois.
 */
export function flushPendingProgress(): Promise<void> {
  if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
  const uid = getActiveSyncUid();
  if (!uid || pendingRemote.size === 0) { pendingRemote.clear(); return Promise.resolve(); }
  const batch = [...pendingRemote.entries()];
  pendingRemote.clear();
  const writes = batch.map(([lessonId, stored]) =>
    saveProgressRemote(uid, lessonId, stored).catch(() => {
      // Firestore indisponível: o dado permanece no localStorage e será
      // migrado/reconciliado no próximo login (firestoreSync).
    }),
  );
  // Limite de espera: logout não pode ficar pendurado numa rede ruim.
  const FLUSH_TIMEOUT_MS = 2_500;
  return Promise.race([
    Promise.all(writes).then(() => undefined),
    new Promise<void>(resolve => setTimeout(resolve, FLUSH_TIMEOUT_MS)),
  ]);
}

/**
 * Descarta escritas pendentes SEM gravar — obrigatório na troca de usuário,
 * para que um debounce do usuário anterior nunca escreva na conta seguinte.
 */
export function cancelPendingProgress(): void {
  if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
  pendingRemote.clear();
}

// Flush oportunista quando a página está sendo fechada/ocultada.
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => { void flushPendingProgress(); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flushPendingProgress();
  });
}

// ── Migration helpers (used by firestoreSync.ts only) ───────────────────────

/** Returns all locally stored progress entries — for migration/merge. */
export function getAllLocalProgress(): Record<number, StoredProgress> {
  const result: Record<number, StoredProgress> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k?.startsWith(PREFIX)) continue;
      const lessonId = parseInt(k.slice(PREFIX.length), 10);
      if (isNaN(lessonId)) continue;
      const raw    = localStorage.getItem(k);
      const parsed = raw ? JSON.parse(raw) : null;
      if (typeof parsed?.pageId === 'number' && typeof parsed?.blockIdx === 'number') {
        result[lessonId] = parsed as StoredProgress;
      }
    }
  } catch {}
  return result;
}

/** Writes a map of Firestore progress back into localStorage — used when
 *  restoring on login. Does NOT trigger a Firestore write. */
export function restoreLocalProgress(progress: Record<number, StoredProgress>): void {
  for (const [lessonId, stored] of Object.entries(progress)) {
    writeLocalProgress(Number(lessonId), stored);
  }
}

/** Removes all progress keys from localStorage.
 *  Called on logout and on login when a different user is detected.
 *  Does NOT touch Firestore. */
export function clearLocalProgressCache(): void {
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(PREFIX)) toRemove.push(k);
    }
    toRemove.forEach(k => localStorage.removeItem(k));
  } catch {}
}

// ── public API ───────────────────────────────────────────────────────────────

export function saveProgress(lessonId: number, anchor: ProgressAnchor): void {
  const stored: StoredProgress = { ...anchor, updatedAt: Date.now() };
  writeLocalProgress(lessonId, stored);
  if (getActiveSyncUid()) scheduleRemoteWrite(lessonId, stored);
}

export function loadProgress(lessonId: number): ProgressAnchor | null {
  try {
    const raw = localStorage.getItem(localKey(lessonId));
    if (raw === null) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.pageId !== 'number' || typeof parsed?.blockIdx !== 'number') return null;
    return parsed as ProgressAnchor;
  } catch { return null; }
}

/** Wipes every lesson's saved position — called once the reader has been
 *  paged all the way through the last lesson, so reopening the book starts
 *  over from its very first page instead of resuming mid-lesson-1. */
export function clearAllProgress(lessonIds: number[]): void {
  cancelPendingProgress(); // posições antigas não devem "ressuscitar" após o reset
  try { lessonIds.forEach(id => localStorage.removeItem(localKey(id))); } catch {}
  const uid = getActiveSyncUid();
  if (uid) clearAllProgressRemote(uid, lessonIds).catch(() => {});
}
