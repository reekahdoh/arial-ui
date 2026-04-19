import { FirebaseError } from 'firebase/app';

export function mapAuthErrorMessage(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case 'auth/email-already-in-use':
        return 'An account already exists for this email.';
      case 'auth/invalid-email':
        return 'Enter a valid email address.';
      case 'auth/weak-password':
        return 'Choose a stronger password.';
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Incorrect username or password.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Try again shortly.';
      case 'auth/network-request-failed':
        return 'Network error. Check your connection.';
      case 'auth/popup-blocked':
        return 'Pop-up was blocked. Allow pop-ups for this site and try again.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in was cancelled.';
      case 'auth/cancelled-popup-request':
        return 'Only one sign-in window at a time. Close the other pop-up and try again.';
      case 'auth/account-exists-with-different-credential':
        return 'An account already exists with this email using a different sign-in method.';
      case 'auth/operation-not-allowed':
        return 'Google sign-in is not enabled for this project. Enable it in the Firebase console.';
      default:
        return err.message || 'Something went wrong. Please try again.';
    }
  }
  if (err instanceof Error) {
    if (err.message === 'UNKNOWN_LOGIN' || err.message === 'EMPTY_LOGIN') {
      return 'Incorrect username or password.';
    }
    if (err.message === 'LOGIN_NAME_EXHAUSTED') {
      return 'Could not allocate a username for this email. Contact support.';
    }
    if (err.message === 'GOOGLE_MISSING_EMAIL') {
      return 'Your Google account does not expose an email address, which this app requires.';
    }
    return err.message;
  }
  return 'Something went wrong. Please try again.';
}
