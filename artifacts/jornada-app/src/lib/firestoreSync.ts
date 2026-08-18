/**
 * Initial Firestore ↔ localStorage synchronisation.
 *
 * Called once per login, before any protected route becomes accessible.
 * Firestore é a FONTE DE VERDADE; localStorage é apenas cache por usuário
 * e fallback de offline.
 *
 * ── UID sentinel ────────────────────────────────────────────────────────────
 * localStorage is NOT namespaced by uid — the same keys are reused across
 * all users on the same browser. To prevent User B from inheriting User A's
 * cached data (and from having that data mistakenly migrated to B's Firestore
 * account), we store the uid that last populated the cache under
 * SESSION_UID_KEY. On every login we compare the incoming uid against the
 * stored one: if they differ (or if the key is absent), we wipe the local
 * cache before proceeding so B always starts from a clean slate.
 *
 * ── Sync paths ──────────────────────────────────────────────────────────────
 * After the cache is guaranteed to belong to the current user:
 *
 *   MIGRATE  — Firestore vazio, localStorage com dados (primeiro login com
 *              atividade local antiga): envia para o Firestore. localStorage
 *              NÃO é limpo até o Firestore confirmar a escrita.
 *
 *   MERGE    — Firestore tem dados (usuário retornando / segundo dispositivo
 *              / mesmo dispositivo): Firestore prevalece. Progresso usa
 *              last-write-wins por updatedAt (um cache local mais novo que o
 *              remoto — ex.: escrita offline — não é rebaixado); highlights
 *              são unidos por id com precedência do Firestore, e highlights
 *              que só existem localmente (escrita que falhou offline) são
 *              reenviados.
 *
 *   NO-OP    — Both empty. Fresh account on a fresh device.
 *
 * A mesma reconciliação roda também quando o MESMO usuário reabre o app no
 * mesmo navegador — é isso que traz edições feitas em outro dispositivo.
 * É idempotente: rodar N vezes não duplica highlights nem regride progresso.
 *
 * ── clearLocalSession ───────────────────────────────────────────────────────
 * Called on sign-out to immediately evict the cached data. Protects against
 * the "different user picks up the same device" scenario even in the brief
 * window before onAuthStateChanged fires for the new user's login.
 */

import {
  loadAllHighlightsRemote,
  loadAllProgressRemote,
  saveHighlightsRemote,
  saveProgressRemote,
} from '@/lib/firestoreService';
import {
  getAllLocalHighlights,
  restoreLocalHighlights,
  clearLocalHighlightsCache,
  type BookHighlight,
} from '@/lib/highlights';
import {
  getAllLocalProgress,
  restoreLocalProgress,
  clearLocalProgressCache,
  type StoredProgress,
} from '@/lib/readerProgress';
import { getActiveSyncUid } from '@/lib/syncStore';

// ── Sentinel ─────────────────────────────────────────────────────────────────

const SESSION_UID_KEY = 'jornada_session_uid';

function getStoredSessionUid(): string | null {
  try { return localStorage.getItem(SESSION_UID_KEY); } catch { return null; }
}

function setStoredSessionUid(uid: string): void {
  try { localStorage.setItem(SESSION_UID_KEY, uid); } catch {}
}

function clearStoredSessionUid(): void {
  try { localStorage.removeItem(SESSION_UID_KEY); } catch {}
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Evicts all user-scoped localStorage cache entries.
 * Called on sign-out so no residue remains for the next user.
 * Never touches Firestore.
 */
export function clearLocalSession(): void {
  clearLocalHighlightsCache();
  clearLocalProgressCache();
  clearStoredSessionUid();
}

/**
 * Runs once per login. Ensures localStorage reflects the current user's
 * Firestore state before any protected route becomes accessible.
 */
export async function performInitialSync(uid: string): Promise<void> {
  // Guarda anti-corrida: se outra transição de auth acontecer enquanto este
  // sync aguarda a rede, NENHUMA mutação de cache/sentinela pode mais rodar —
  // senão um sync atrasado do usuário A poderia repovoar o cache já entregue
  // ao usuário B. getActiveSyncUid é atualizado sincronamente pelo AuthContext
  // em toda transição, então é a fonte segura de "quem é o dono agora".
  const isActive = () => getActiveSyncUid() === uid;

  // ── Guard: evict a different user's cache ─────────────────────────────────
  const storedUid = getStoredSessionUid();
  const sameUser  = storedUid === uid;

  if (storedUid !== null && !sameUser) {
    // Sentinela de OUTRO usuário → cache comprovadamente alheio: descarta.
    clearLocalHighlightsCache();
    clearLocalProgressCache();
    // (sentinel is stale — we set it at the end of a successful sync)
  }
  // Sentinela AUSENTE: dados legados (gravados antes do sync existir) ou
  // primeiro login neste navegador. NÃO limpar aqui — o caminho MIGRATE
  // abaixo é a única chance de preservar a leitura antiga desse usuário.
  // (Se o Firestore já tiver dados, ele prevalece e o cache é substituído.)
  const cacheIsOwn = sameUser; // cache confirmado como do próprio usuário

  // ── Fetch Firestore state for both stores in parallel (4 s timeout) ────────
  // If Firestore is slow (cold start, poor connectivity) we proceed with
  // whatever is already in localStorage rather than blocking the user.
  // Nada local é apagado nesse caso — re-sincroniza no próximo login.
  const SYNC_TIMEOUT_MS = 4_000;
  const TIMED_OUT = Symbol('sync-timeout');

  const withTimeout = <T,>(promise: Promise<T>): Promise<T | typeof TIMED_OUT> =>
    Promise.race<T | typeof TIMED_OUT>([
      promise.catch((): typeof TIMED_OUT => TIMED_OUT), // falha de rede tratada como indisponível
      new Promise<typeof TIMED_OUT>(resolve => setTimeout(() => resolve(TIMED_OUT), SYNC_TIMEOUT_MS)),
    ]);

  const [remoteHighlightsRes, remoteProgressRes] = await Promise.all([
    withTimeout(loadAllHighlightsRemote(uid)),
    withTimeout(loadAllProgressRemote(uid)),
  ]);

  // Sessão mudou durante o fetch → aborta sem tocar em nada.
  if (!isActive()) return;

  // ── Highlights ─────────────────────────────────────────────────────────────
  if (remoteHighlightsRes !== TIMED_OUT) {
    const remoteHighlights = remoteHighlightsRes;
    const localHighlights  = getAllLocalHighlights();

    if (remoteHighlights.length === 0 && localHighlights.length > 0) {
      // MIGRATE: first login with pre-existing local data → push to Firestore.
      // localStorage is untouched; data is safe even if this write fails.
      // Idempotente: os ids locais são os ids dos documentos (setDoc).
      await saveHighlightsRemote(uid, localHighlights);
      if (!isActive()) return;
    } else if (remoteHighlights.length > 0) {
      // MERGE: Firestore prevalece por id; highlights apenas locais (escritas
      // que falharam offline nesta mesma conta) são preservados e reenviados.
      const remoteIds  = new Set(remoteHighlights.map(h => h.id));
      const localOnly: BookHighlight[] = cacheIsOwn
        ? localHighlights.filter(h => !remoteIds.has(h.id))
        : []; // cache não é comprovadamente deste usuário → remoto substitui
      restoreLocalHighlights([...remoteHighlights, ...localOnly]);
      if (localOnly.length > 0) saveHighlightsRemote(uid, localOnly).catch(() => {});
    }
    // else: both empty — nothing to do.
  }

  if (!isActive()) return;

  // ── Reading progress ────────────────────────────────────────────────────────
  if (remoteProgressRes !== TIMED_OUT) {
    const remoteProgress = remoteProgressRes;
    const localProgress  = getAllLocalProgress();
    const hasLocal  = Object.keys(localProgress).length > 0;
    const hasRemote = Object.keys(remoteProgress).length > 0;

    if (!hasRemote && hasLocal) {
      // MIGRATE: first login — push each lesson's progress to Firestore.
      // Idempotente: um doc por lição; regravar produz o mesmo estado.
      await Promise.all(
        Object.entries(localProgress).map(([lessonId, stored]) =>
          saveProgressRemote(uid, Number(lessonId), stored),
        ),
      );
      if (!isActive()) return;
    } else if (hasRemote) {
      // MERGE sobre a UNIÃO das lições (local ∪ remoto): o carimbo mais novo
      // vence por lição. Lições que só existem localmente (ex.: lidas offline
      // nesta conta) são preservadas e reenviadas ao Firestore.
      const merged: Record<number, StoredProgress> = { ...remoteProgress };
      if (cacheIsOwn) {
        for (const [lessonIdStr, local] of Object.entries(localProgress)) {
          const lessonId = Number(lessonIdStr);
          const remote   = remoteProgress[lessonId];
          if (!remote || (local.updatedAt ?? 0) > (remote.updatedAt ?? 0)) {
            merged[lessonId] = local;
            saveProgressRemote(uid, lessonId, local).catch(() => {});
          }
        }
      }
      restoreLocalProgress(merged);
    }
  }

  // ── Stamp the sentinel ────────────────────────────────────────────────────
  // Only written after a successful sync so an interrupted sync does not
  // leave a stale sentinel that suppresses the next eviction.
  if (isActive()) setStoredSessionUid(uid);
}
