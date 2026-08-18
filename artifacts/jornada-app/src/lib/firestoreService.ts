/**
 * Firestore service layer — all user data lives under:
 *
 *   users/{uid}                           → UserProfile
 *   users/{uid}/progress/{lessonId}       → LessonProgress
 *   users/{uid}/highlights/{highlightId}  → BookHighlight
 *
 * Every function is async and receives the uid explicitly so callers
 * never need to import `auth` directly — keeping concerns separated.
 *
 * Notes are embedded in highlights (the `note` field), so there is no
 * separate notes collection; a "note" is just a highlight with text.
 */

import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  writeBatch,
  serverTimestamp,
  runTransaction,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ProgressAnchor, StoredProgress } from '@/lib/readerProgress';
import type { BookHighlight } from '@/lib/highlights';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  uid:         string;
  email:       string;
  displayName: string | null;
  createdAt:   Timestamp | null;
  lastSeenAt:  Timestamp | null;
}

export interface LessonProgress extends ProgressAnchor {
  lessonId:  number;
  /** Carimbo do CLIENTE no momento da leitura (epoch ms) — usado para
   *  last-write-wins entre dispositivos. */
  updatedAtMs?: number;
  /** Carimbo do servidor (auditoria; não usado para conflito). */
  updatedAt: Timestamp | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const userRef  = (uid: string)                      => doc(db, 'users', uid);
const progRef  = (uid: string, lessonId: number)    => doc(db, 'users', uid, 'progress', String(lessonId));
const progCol  = (uid: string)                      => collection(db, 'users', uid, 'progress');
const hlRef    = (uid: string, highlightId: string) => doc(db, 'users', uid, 'highlights', highlightId);
const hlCol    = (uid: string)                      => collection(db, 'users', uid, 'highlights');

// ─── User profile ─────────────────────────────────────────────────────────────

/**
 * Creates the user profile document if it doesn't exist yet.
 * Safe to call on every login — uses `{ merge: true }` so it never
 * overwrites existing data.
 */
export async function ensureUserProfile(uid: string, email: string, displayName: string | null = null): Promise<void> {
  const ref  = userRef(uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid,
      email,
      displayName,
      createdAt:  serverTimestamp(),
      lastSeenAt: serverTimestamp(),
    });
  } else {
    await setDoc(ref, { lastSeenAt: serverTimestamp() }, { merge: true });
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(userRef(uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

// ─── Reading progress ─────────────────────────────────────────────────────────

/**
 * Grava o progresso com last-write-wins por `updatedAtMs`:
 * se o documento existente for MAIS NOVO que o dado sendo gravado, a escrita
 * é descartada — um notebook antigo que abre na página 10 nunca sobrescreve
 * a página 30 salva pelo celular minutos antes.
 */
export async function saveProgressRemote(uid: string, lessonId: number, stored: StoredProgress): Promise<void> {
  const incomingMs = stored.updatedAt ?? Date.now();
  await runTransaction(db, async (tx) => {
    const ref  = progRef(uid, lessonId);
    const snap = await tx.get(ref);
    if (snap.exists()) {
      const existing = snap.data() as LessonProgress;
      if (typeof existing.updatedAtMs === 'number' && existing.updatedAtMs > incomingMs) return;
    }
    tx.set(ref, {
      lessonId,
      pageId:      stored.pageId,
      blockIdx:    stored.blockIdx,
      updatedAtMs: incomingMs,
      updatedAt:   serverTimestamp(),
    });
  });
}

export async function loadProgressRemote(uid: string, lessonId: number): Promise<StoredProgress | null> {
  const snap = await getDoc(progRef(uid, lessonId));
  if (!snap.exists()) return null;
  const data = snap.data() as LessonProgress;
  return { pageId: data.pageId, blockIdx: data.blockIdx, updatedAt: data.updatedAtMs };
}

/** Returns a map of lessonId → StoredProgress for all lessons this user has touched. */
export async function loadAllProgressRemote(uid: string): Promise<Record<number, StoredProgress>> {
  const snap = await getDocs(progCol(uid));
  const result: Record<number, StoredProgress> = {};
  snap.forEach(d => {
    const data = d.data() as LessonProgress;
    result[data.lessonId] = { pageId: data.pageId, blockIdx: data.blockIdx, updatedAt: data.updatedAtMs };
  });
  return result;
}

export async function clearAllProgressRemote(uid: string, lessonIds: number[]): Promise<void> {
  const batch = writeBatch(db);
  lessonIds.forEach(id => batch.delete(progRef(uid, id)));
  await batch.commit();
}

// ─── Highlights ───────────────────────────────────────────────────────────────

export async function saveHighlightRemote(uid: string, highlight: BookHighlight): Promise<void> {
  await setDoc(hlRef(uid, highlight.id), highlight);
}

/** Batch-saves a multi-paragraph selection (all records share a groupId). */
export async function saveHighlightsRemote(uid: string, highlights: BookHighlight[]): Promise<void> {
  if (highlights.length === 0) return;
  const batch = writeBatch(db);
  highlights.forEach(h => batch.set(hlRef(uid, h.id), h));
  await batch.commit();
}

export async function removeHighlightRemote(uid: string, highlightId: string): Promise<void> {
  await deleteDoc(hlRef(uid, highlightId));
}

/** Removes every record of a logical highlight group from Firestore. */
export async function removeHighlightGroupRemote(uid: string, gKey: string, allHighlights: BookHighlight[]): Promise<void> {
  const batch = writeBatch(db);
  allHighlights
    .filter(h => (h.groupId ?? h.id) === gKey)
    .forEach(h => batch.delete(hlRef(uid, h.id)));
  await batch.commit();
}

export async function patchHighlightNoteRemote(uid: string, highlightId: string, note: string, allHighlights: BookHighlight[]): Promise<void> {
  const now    = new Date().toISOString();
  const target = allHighlights.find(h => h.id === highlightId);
  if (!target) return;
  const gKey  = target.groupId ?? target.id;
  const batch = writeBatch(db);
  allHighlights
    .filter(h => (h.groupId ?? h.id) === gKey)
    .forEach(h => batch.set(hlRef(uid, h.id), { ...h, note, updatedAt: now }));
  await batch.commit();
}

/** All highlights for this user, sorted by book order. */
export async function loadAllHighlightsRemote(uid: string): Promise<BookHighlight[]> {
  const snap = await getDocs(query(hlCol(uid), orderBy('lessonId'), orderBy('pageIndex'), orderBy('blockIdx'), orderBy('startOffset')));
  return snap.docs.map(d => d.data() as BookHighlight);
}
