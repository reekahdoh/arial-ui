import { createUserWithEmailAndPassword, deleteUser, type Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { createUserProfile } from './createUserProfile';

export async function registerWithEmail(
  auth: Auth,
  db: Firestore,
  emailRaw: string,
  password: string,
): Promise<{ loginName: string }> {
  const email = emailRaw.trim().toLowerCase();
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  try {
    const loginName = await createUserProfile(db, credential.user.uid, email);
    return { loginName };
  } catch (err) {
    await deleteUser(credential.user);
    throw err;
  }
}
