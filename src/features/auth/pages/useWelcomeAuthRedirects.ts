import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from 'firebase/auth';
import {
  AUTH_REDIRECT_ERROR_MESSAGE_KEY,
  GOOGLE_SIGNIN_WELCOME_MESSAGE_KEY,
} from '../../../services/auth/signInWithGoogle';

export function useWelcomeAuthRedirects(
  loading: boolean,
  user: User | null,
  setFormError: (message: string | null) => void,
) {
  const navigate = useNavigate();

  useEffect(() => {
    const redirectError = sessionStorage.getItem(AUTH_REDIRECT_ERROR_MESSAGE_KEY);
    if (redirectError) {
      sessionStorage.removeItem(AUTH_REDIRECT_ERROR_MESSAGE_KEY);
      setFormError(redirectError);
    }
  }, [setFormError]);

  useEffect(() => {
    if (!loading && user) {
      const redirectMsg = sessionStorage.getItem(GOOGLE_SIGNIN_WELCOME_MESSAGE_KEY);
      if (redirectMsg) sessionStorage.removeItem(GOOGLE_SIGNIN_WELCOME_MESSAGE_KEY);
      navigate('/home', {
        replace: true,
        ...(redirectMsg ? { state: { registeredMessage: redirectMsg } } : {}),
      });
    }
  }, [loading, user, navigate]);
}
