/**
 * Firebase app initialisation.
 * Config values come from Replit Secrets (VITE_FIREBASE_*) — never hardcoded.
 */
import { initializeApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

// Persist the session across browser restarts (local storage).
// Called once at module load — safe to ignore the promise here since
// the auth state observer (onAuthStateChanged) is set up before any
// sign-in call that would need it.
setPersistence(auth, browserLocalPersistence).catch(() => {});
