import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth,
  setPersistence,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile,
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Standard Firebase Auth instance (automatically wires browserPopupRedirectResolver)
export const auth = getAuth(app);

// Gracefully switch to browserLocalPersistence (localStorage) so tablet browsers (Safari iPadOS, Android)
// do not throw "IDBDatabase is closing" / "database is hidden" when a popup opens or tab loses focus.
if (typeof window !== 'undefined') {
  try {
    setPersistence(auth, browserLocalPersistence).catch((e) => {
      console.warn('Firebase setPersistence notice:', e?.message);
    });
  } catch (e) {
    console.warn('Firebase setPersistence error:', e);
  }
}

export { browserPopupRedirectResolver };
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// In-memory token cache for Google Workspace APIs (per guidelines: do NOT store in localStorage)
let cachedGmailAccessToken: string | null = null;

export const setGmailAccessToken = (token: string | null) => {
  cachedGmailAccessToken = token;
};

export const getGmailAccessToken = (): string | null => {
  return cachedGmailAccessToken;
};

// Initialize Firestore with ignoreUndefinedProperties: true to prevent rejection of optional fields
let firestoreInstance;
try {
  const customDbId = (firebaseConfig as any).firestoreDatabaseId;
  if (customDbId && customDbId !== '(default)') {
    firestoreInstance = initializeFirestore(app, { ignoreUndefinedProperties: true }, customDbId);
  } else {
    firestoreInstance = initializeFirestore(app, { ignoreUndefinedProperties: true });
  }
} catch (e) {
  // If already initialized, fallback to getFirestore
  firestoreInstance = getFirestore(app);
}

export const db = firestoreInstance;

/**
 * Deeply sanitizes any object or array before writing to Firestore.
 * Removes any undefined fields or properties that would cause Firestore setDoc/updateDoc to throw errors.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (typeof data === 'number') {
    if (Number.isNaN(data) || !Number.isFinite(data)) {
      return 0 as unknown as T;
    }
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        if (typeof value === 'number' && (Number.isNaN(value) || !Number.isFinite(value))) {
          clean[key] = 0;
        } else {
          clean[key] = sanitizeForFirestore(value);
        }
      }
    }
    return clean as T;
  }
  return data;
}

export {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged
};
export type { User };
