import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from 'firebase/auth';
import { AUTH_REDIRECT_ERROR_MESSAGE_KEY } from '../../../services/auth/signInWithGoogle';

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
      navigate('/home', { replace: true });
    }
  }, [loading, user, navigate]);
}
