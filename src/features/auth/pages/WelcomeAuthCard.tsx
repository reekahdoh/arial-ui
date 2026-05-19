import { Button, Divider, Tab, Tabs, Typography } from '@mui/material';
import type { UseFormReturn } from 'react-hook-form';
import { AppCard } from '../../../components/ui/AppCard';
import { GoogleIcon } from '../../../components/ui/GoogleIcon';
import type { RegisterFormValues, SignInFormValues } from '../authSchemas';
import type { AuthTabKey } from './useWelcomeAuthPage';
import { WelcomeAuthRegisterForm } from './WelcomeAuthRegisterForm';
import { WelcomeAuthSignInForm } from './WelcomeAuthSignInForm';

const googleButtonSx = {
  py: 1,
  fontWeight: 600,
  borderColor: 'border.default',
  color: 'text.primary',
  '&:hover': { borderColor: 'text.secondary', bgcolor: 'action.hover' },
} as const;

export function WelcomeAuthCard({
  tab,
  onTabChange,
  configured,
  submitting,
  signInForm,
  registerForm,
  onSignIn,
  onRegister,
  onGoogleSignIn,
}: {
  tab: AuthTabKey;
  onTabChange: (tab: AuthTabKey) => void;
  configured: boolean;
  submitting: boolean;
  signInForm: UseFormReturn<SignInFormValues>;
  registerForm: UseFormReturn<RegisterFormValues>;
  onSignIn: () => void;
  onRegister: () => void;
  onGoogleSignIn: () => void;
}) {
  return (
    <AppCard>
      <Button
        type="button"
        variant="outlined"
        color="inherit"
        fullWidth
        size="large"
        startIcon={<GoogleIcon />}
        onClick={onGoogleSignIn}
        disabled={submitting || !configured}
        sx={googleButtonSx}
      >
        Continue with Google
      </Button>

      <Divider sx={{ my: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
          or use email
        </Typography>
      </Divider>

      <Tabs value={tab} onChange={(_, value) => onTabChange(value as AuthTabKey)} variant="fullWidth" sx={{ mb: 2, minHeight: 40 }}>
        <Tab value="signin" label="Sign in" sx={{ textTransform: 'none', fontWeight: 600 }} />
        <Tab value="register" label="Register" sx={{ textTransform: 'none', fontWeight: 600 }} />
      </Tabs>

      {tab === 'signin' ? (
        <WelcomeAuthSignInForm form={signInForm} submitting={submitting} onSubmit={onSignIn} />
      ) : (
        <WelcomeAuthRegisterForm form={registerForm} submitting={submitting} onSubmit={onRegister} />
      )}
    </AppCard>
  );
}
