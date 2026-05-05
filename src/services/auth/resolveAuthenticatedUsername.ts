import type { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { FIRESTORE_COLLECTION_USER_PROFILES } from '../../constants/firestoreCollections';
import { getFirebase, isFirebaseConfigured } from '../firebase';

export async function resolveAuthenticatedUsername(user: User): Promise<string> {
  if (isFirebaseConfigured()) {
    try {
      const { db } = getFirebase();
      const snap = await getDoc(doc(db, FIRESTORE_COLLECTION_USER_PROFILES, user.uid));
      const loginName = snap.exists() ? snap.data().loginName : null;
      if (typeof loginName === 'string' && loginName.trim()) {
        return loginName.trim();
      }
    } catch {
      // Fall through to Auth profile fields if the profile is unavailable.
    }
  }

  const emailName = user.email?.trim().split('@')[0];
  return user.displayName?.trim() || emailName || user.uid;
}
