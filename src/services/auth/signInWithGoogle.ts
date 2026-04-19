import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type Auth,
  type User,
} from 'firebase/auth';
import { doc, getDoc, type Firestore } from 'firebase/firestore';
import { FIRESTORE_COLLECTION_USER_PROFILES } from '../../constants/firestoreCollections';
import { isUsingFirebaseEmulators } from '../firebase';
import { createUserProfile } from './createUserProfile';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/** Session key for the post–redirect welcome message (Auth emulator uses redirect, not popup). */
export const GOOGLE_SIGNIN_WELCOME_MESSAGE_KEY = 'aira_google_signin_welcome_message';

/** Session key for surfacing redirect errors back on the login page. */
export const AUTH_REDIRECT_ERROR_MESSAGE_KEY = 'aira_auth_redirect_error_message';

export type GoogleSignInResult = {
  /** Set when this was the first sign-in and a new profile row was created. */
  newLoginName?: string;
};

/**
 * After Google sign-in (popup or redirect), ensures Firestore profile + login name exist
 * when this is the user’s first sign-in.
 */
export async function ensureGoogleUserProfile(auth: Auth, db: Firestore, user: User): Promise<GoogleSignInResult> {
  const email = user.email?.trim().toLowerCase();
  if (!email) {
    await signOut(auth);
    throw new Error('GOOGLE_MISSING_EMAIL');
  }

  const profileRef = doc(db, FIRESTORE_COLLECTION_USER_PROFILES, user.uid);
  const existing = await getDoc(profileRef);
  if (!existing.exists()) {
    try {
      const loginName = await createUserProfile(db, user.uid, email);
      return { newLoginName: loginName };
    } catch (err) {
      await signOut(auth);
      throw err;
    }
  }
  return {};
}

/**
 * Opens the Google account picker, then ensures Firestore profile + login name exist
 * (same shape as email registration) when this is the user’s first sign-in.
 *
 * With the Auth emulator, uses redirect flow — popup OAuth is unreliable there (“No matching frame”).
 */
export async function signInWithGoogle(auth: Auth, db: Firestore): Promise<GoogleSignInResult> {
  if (isUsingFirebaseEmulators()) {
    await signInWithRedirect(auth, googleProvider);
    return {};
  }

  const credential = await signInWithPopup(auth, googleProvider);
  return ensureGoogleUserProfile(auth, db, credential.user);
}
