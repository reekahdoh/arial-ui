import { doc, getDoc, type Firestore } from 'firebase/firestore';
import { FIRESTORE_COLLECTION_LOGIN_NAMES } from '../../constants/firestoreCollections';

/**
 * Resolves the Firebase Auth email for sign-in.
 * Accepts a full email, or a login name stored under `loginNames`.
 */
export async function resolveSignInEmail(db: Firestore, loginId: string): Promise<string> {
  const trimmed = loginId.trim();
  if (!trimmed) {
    throw new Error('EMPTY_LOGIN');
  }
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase();
  }
  const key = trimmed.toLowerCase();
  const snap = await getDoc(doc(db, FIRESTORE_COLLECTION_LOGIN_NAMES, key));
  if (!snap.exists()) {
    throw new Error('UNKNOWN_LOGIN');
  }
  const data = snap.data() as { email?: unknown };
  if (typeof data.email !== 'string') {
    throw new Error('UNKNOWN_LOGIN');
  }
  return data.email.toLowerCase();
}
