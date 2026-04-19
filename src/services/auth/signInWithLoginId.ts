import { signInWithEmailAndPassword, type Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { resolveSignInEmail } from './resolveSignInEmail';

export async function signInWithLoginId(
  auth: Auth,
  db: Firestore,
  loginId: string,
  password: string,
): Promise<void> {
  const email = await resolveSignInEmail(db, loginId);
  await signInWithEmailAndPassword(auth, email, password);
}
