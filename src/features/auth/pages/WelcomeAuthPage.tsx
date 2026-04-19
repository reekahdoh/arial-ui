import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { AppCard } from '../../../components/ui/AppCard';
import { GoogleIcon } from '../../../components/ui/GoogleIcon';
import { getFirebase, isUsingFirebaseEmulators } from '../../../services/firebase';
import {
  AUTH_REDIRECT_ERROR_MESSAGE_KEY,
  GOOGLE_SIGNIN_WELCOME_MESSAGE_KEY,
} from '../../../services/auth/signInWithGoogle';
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

type TabKey = 'signin' | 'register';

export function WelcomeAuthPage() {
  const navigate = useNavigate();
  const { user, loading, configured } = useAuth();
  const [tab, setTab] = useState<TabKey>('signin');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const redirectError = sessionStorage.getItem(AUTH_REDIRECT_ERROR_MESSAGE_KEY);
    if (redirectError) {
      sessionStorage.removeItem(AUTH_REDIRECT_ERROR_MESSAGE_KEY);
      setFormError(redirectError);
    }
  }, []);

  useEffect(() => {
    if (!loading && user) {
      const redirectMsg = sessionStorage.getItem(GOOGLE_SIGNIN_WELCOME_MESSAGE_KEY);
      if (redirectMsg) {
        sessionStorage.removeItem(GOOGLE_SIGNIN_WELCOME_MESSAGE_KEY);
      }
      navigate('/home', {
        replace: true,
        ...(redirectMsg ? { state: { registeredMessage: redirectMsg } } : {}),
      });
    }
  }, [loading, user, navigate]);

  const signInForm = useForm<SignInFormValues>({
    resolver: zodResolver(signInFormSchema),
    defaultValues: { username: '', password: '' },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const onSignIn = signInForm.handleSubmit(async (values) => {
    setFormError(null);
    if (!configured) {
      setFormError('Firebase is not configured. Add REACT_APP_FIREBASE_* keys to `.env.local`.');
      return;
    }
    setSubmitting(true);
    try {
      const { auth, db } = getFirebase();
      await signInWithLoginId(auth, db, values.username, values.password);
      navigate('/home', { replace: true });
    } catch (err) {
      setFormError(mapAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  });

  const onGoogleSignIn = async () => {
    setFormError(null);
    if (!configured) {
      setFormError('Firebase is not configured. Add REACT_APP_FIREBASE_* keys to `.env.local`.');
      return;
    }
    setSubmitting(true);
    try {
      const { auth, db } = getFirebase();
      const { newLoginName } = await signInWithGoogle(auth, db);
      if (isUsingFirebaseEmulators()) {
        return;
      }
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
    } catch (err) {
      setFormError(mapAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const onRegister = registerForm.handleSubmit(async (values) => {
    setFormError(null);
    if (!configured) {
      setFormError('Firebase is not configured. Add REACT_APP_FIREBASE_* keys to `.env.local`.');
      return;
    }
    setSubmitting(true);
    try {
      const { auth, db } = getFirebase();
      const { loginName } = await registerWithEmail(auth, db, values.email, values.password);
      registerForm.reset();
      navigate('/home', {
        replace: true,
        state: {
          registeredMessage: `Account created. Your username is "${loginName}" — use it or your email when you sign in.`,
        },
      });
    } catch (err) {
      setFormError(mapAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  });

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        px: 2,
        py: 4,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 420 }}>
        <Typography variant="h2" component="h1" sx={{ mb: 0.5, textAlign: 'center' }}>
          AIRA
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
          Risk assessments — sign in to continue
        </Typography>

        {!configured ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Copy <Typography component="span" variant="captionStrong">.env.example</Typography> to{' '}
            <Typography component="span" variant="captionStrong">.env.local</Typography> and set your Firebase web
            app keys, then restart the dev server.
          </Alert>
        ) : null}

        {formError ? (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFormError(null)}>
            {formError}
          </Alert>
        ) : null}

        <AppCard>
          <Button
            type="button"
            variant="outlined"
            color="inherit"
            fullWidth
            size="large"
            startIcon={<GoogleIcon />}
            onClick={() => void onGoogleSignIn()}
            disabled={submitting || !configured}
            sx={{
              py: 1,
              fontWeight: 600,
              borderColor: 'border.default',
              color: 'text.primary',
              '&:hover': { borderColor: 'text.secondary', bgcolor: 'action.hover' },
            }}
          >
            Continue with Google
          </Button>

          <Divider sx={{ my: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
              or use email
            </Typography>
          </Divider>

          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v as TabKey)}
            variant="fullWidth"
            sx={{ mb: 2, minHeight: 40 }}
          >
            <Tab value="signin" label="Sign in" sx={{ textTransform: 'none', fontWeight: 600 }} />
            <Tab value="register" label="Register" sx={{ textTransform: 'none', fontWeight: 600 }} />
          </Tabs>

          {tab === 'signin' ? (
            <Box component="form" onSubmit={onSignIn} noValidate>
              <TextField
                label="Username or email"
                fullWidth
                margin="dense"
                autoComplete="username"
                disabled={submitting}
                error={Boolean(signInForm.formState.errors.username)}
                helperText={signInForm.formState.errors.username?.message}
                {...signInForm.register('username')}
              />
              <TextField
                label="Password"
                type="password"
                fullWidth
                margin="dense"
                autoComplete="current-password"
                disabled={submitting}
                error={Boolean(signInForm.formState.errors.password)}
                helperText={signInForm.formState.errors.password?.message}
                {...signInForm.register('password')}
              />
              <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }} disabled={submitting}>
                Sign in
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={onRegister} noValidate>
              <TextField
                label="Email"
                type="email"
                fullWidth
                margin="dense"
                autoComplete="email"
                disabled={submitting}
                error={Boolean(registerForm.formState.errors.email)}
                helperText={registerForm.formState.errors.email?.message}
                {...registerForm.register('email')}
              />
              <TextField
                label="Password"
                type="password"
                fullWidth
                margin="dense"
                autoComplete="new-password"
                disabled={submitting}
                error={Boolean(registerForm.formState.errors.password)}
                helperText={registerForm.formState.errors.password?.message}
                {...registerForm.register('password')}
              />
              <TextField
                label="Confirm password"
                type="password"
                fullWidth
                margin="dense"
                autoComplete="new-password"
                disabled={submitting}
                error={Boolean(registerForm.formState.errors.confirmPassword)}
                helperText={registerForm.formState.errors.confirmPassword?.message}
                {...registerForm.register('confirmPassword')}
              />
              <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }} disabled={submitting}>
                Create account
              </Button>
            </Box>
          )}
        </AppCard>
      </Box>
    </Box>
  );
}
