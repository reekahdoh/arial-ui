import type { User } from 'firebase/auth';
import { getRedirectResult, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getFirebase, isFirebaseConfigured } from '../services/firebase';
import {
  AUTH_REDIRECT_ERROR_MESSAGE_KEY,
  ensureGoogleUserProfile,
  GOOGLE_SIGNIN_WELCOME_MESSAGE_KEY,
} from '../services/auth/signInWithGoogle';
import { mapAuthErrorMessage } from '../services/auth/mapAuthErrorMessage';

export type AuthContextValue = {
  user: User | null;
  loading: boolean;
  configured: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setUser(null);
      setLoading(false);
      return;
    }

    const { auth, db } = getFirebase();
    const unsub = onAuthStateChanged(auth, (next) => {
      setUser(next);
      setLoading(false);
    });

    void (async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          try {
            const profile = await ensureGoogleUserProfile(auth, db, result.user);
            if (profile.newLoginName) {
              sessionStorage.setItem(
                GOOGLE_SIGNIN_WELCOME_MESSAGE_KEY,
                `Signed in with Google. Your username is "${profile.newLoginName}" — use it or your email when you sign in.`,
              );
            }
          } catch {
            // Profile setup may sign the user out; auth state listener reflects final state.
          }
        }
      } catch (err) {
        // If redirect flow failed, surface it back to the login page.
        sessionStorage.setItem(AUTH_REDIRECT_ERROR_MESSAGE_KEY, mapAuthErrorMessage(err));
      }
    })();

    return unsub;
  }, []);

  const signOut = useCallback(async () => {
    if (!isFirebaseConfigured()) {
      return;
    }
    const { auth } = getFirebase();
    await firebaseSignOut(auth);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      configured: isFirebaseConfigured(),
      signOut,
    }),
    [user, loading, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
