import { FirebaseError } from 'firebase/app';

const FIREBASE_AUTH_ERROR_MESSAGES: Record<string, string> = {
  'auth/email-already-in-use': 'An account already exists for this email.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/weak-password': 'Choose a stronger password.',
  'auth/invalid-credential': 'Incorrect username or password.',
  'auth/wrong-password': 'Incorrect username or password.',
  'auth/user-not-found': 'Incorrect username or password.',
  'auth/too-many-requests': 'Too many attempts. Try again shortly.',
  'auth/network-request-failed': 'Network error. Check your connection.',
  'auth/popup-blocked': 'Pop-up was blocked. Allow pop-ups for this site and try again.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/cancelled-popup-request': 'Only one sign-in window at a time. Close the other pop-up and try again.',
  'auth/account-exists-with-different-credential':
    'An account already exists with this email using a different sign-in method.',
  'auth/operation-not-allowed': 'Google sign-in is not enabled for this project. Enable it in the Firebase console.',
  'auth/configuration-not-found':
    'Google sign-in is not set up for this Firebase project. In the console open Authentication → Sign-in method, enable Google, and save.',
};

const APP_AUTH_ERROR_MESSAGES: Record<string, string> = {
  UNKNOWN_LOGIN: 'Incorrect username or password.',
  EMPTY_LOGIN: 'Incorrect username or password.',
  LOGIN_NAME_EXHAUSTED: 'Could not allocate a username for this email. Contact support.',
  GOOGLE_MISSING_EMAIL: 'Your Google account does not expose an email address, which this app requires.',
};

export function mapAuthErrorMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    return FIREBASE_AUTH_ERROR_MESSAGES[err.code] ?? err.message ?? 'Something went wrong. Please try again.';
  }
  if (err instanceof Error) {
    return APP_AUTH_ERROR_MESSAGES[err.message] ?? err.message;
  }
  return 'Something went wrong. Please try again.';
}
