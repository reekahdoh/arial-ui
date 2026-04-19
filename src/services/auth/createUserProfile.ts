import {
  doc,
  runTransaction,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import {
  FIRESTORE_COLLECTION_LOGIN_NAMES,
  FIRESTORE_COLLECTION_USER_PROFILES,
} from '../../constants/firestoreCollections';
import { emailLocalPartSlug } from '../../utils/emailSlug';

const MAX_LOGIN_NAME_ATTEMPTS = 50;

/**
 * Allocates a unique `loginNames/{loginName}` row and creates `userProfiles/{uid}`.
 * Must run while the Auth user for `uid` already exists.
 */
export async function createUserProfile(
  db: Firestore,
  uid: string,
  emailLower: string,
): Promise<string> {
  const base = emailLocalPartSlug(emailLower);

  for (let attempt = 0; attempt < MAX_LOGIN_NAME_ATTEMPTS; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}_${attempt}`;
    try {
      let chosen: string | null = null;
      await runTransaction(db, async (transaction) => {
        const nameRef = doc(db, FIRESTORE_COLLECTION_LOGIN_NAMES, candidate);
        const nameSnap = await transaction.get(nameRef);
        if (nameSnap.exists()) {
          throw new Error('COLLISION');
        }
        const profileRef = doc(db, FIRESTORE_COLLECTION_USER_PROFILES, uid);
        transaction.set(nameRef, { uid, email: emailLower });
        transaction.set(profileRef, {
          email: emailLower,
          loginName: candidate,
          createdAt: serverTimestamp(),
        });
        chosen = candidate;
      });
      if (chosen) {
        return chosen;
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'COLLISION') {
        continue;
      }
      throw err;
    }
  }

  throw new Error('LOGIN_NAME_EXHAUSTED');
}
