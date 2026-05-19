import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { getFirebase, isUsingFirebaseEmulators } from '../../../services/firebase';
import { mapAuthErrorMessage } from '../../../services/auth/mapAuthErrorMessage';
import { registerWithEmail } from '../../../services/auth/registerWithEmail';
import { signInWithGoogle } from '../../../services/auth/signInWithGoogle';
import { signInWithLoginId } from '../../../services/auth/signInWithLoginId';
import {
  type RegisterFormValues,
  registerFormSchema,
  type SignInFormValues,
  signInFormSchema,
} from '../authSchemas';
import { FIREBASE_NOT_CONFIGURED_MESSAGE } from './welcomeAuthConstants';
import { useWelcomeAuthRedirects } from './useWelcomeAuthRedirects';

export type AuthTabKey = 'signin' | 'register';

export function useWelcomeAuthPage() {
  const navigate = useNavigate();
  const { user, loading, configured } = useAuth();
  const [tab, setTab] = useState<AuthTabKey>('signin');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const signInForm = useForm<SignInFormValues>({
    resolver: zodResolver(signInFormSchema),
    defaultValues: { username: '', password: '' },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  useWelcomeAuthRedirects(loading, user, setFormError);

  const runAuthAction = async (action: () => Promise<void>) => {
    setFormError(null);
    if (!configured) {
      setFormError(FIREBASE_NOT_CONFIGURED_MESSAGE);
      return;
    }
    setSubmitting(true);
    try {
      await action();
    } catch (err) {
      setFormError(mapAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const onSignIn = signInForm.handleSubmit((values) =>
    runAuthAction(async () => {
      const { auth, db } = getFirebase();
      await signInWithLoginId(auth, db, values.username, values.password);
      navigate('/home', { replace: true });
    }),
  );

  const onRegister = registerForm.handleSubmit((values) =>
    runAuthAction(async () => {
      const { auth, db } = getFirebase();
      const { loginName } = await registerWithEmail(auth, db, values.email, values.password);
      registerForm.reset();
      navigate('/home', {
        replace: true,
        state: {
          registeredMessage: `Account created. Your username is "${loginName}" — use it or your email when you sign in.`,
        },
      });
    }),
  );

  const onGoogleSignIn = () =>
    runAuthAction(async () => {
      const { auth, db } = getFirebase();
      const { newLoginName } = await signInWithGoogle(auth, db);
      if (isUsingFirebaseEmulators()) return;
      navigate('/home', {
        replace: true,
        ...(newLoginName
          ? {
              state: {
                registeredMessage: `Signed in with Google. Your username is "${newLoginName}" — use it or your email when you sign in.`,
              },
            }
          : {}),
      });
    });

  return {
    loading,
    configured,
    tab,
    setTab,
    formError,
    setFormError,
    submitting,
    signInForm,
    registerForm,
    onSignIn,
    onRegister,
    onGoogleSignIn,
  };
}
