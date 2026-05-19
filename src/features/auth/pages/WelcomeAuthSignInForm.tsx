import { Box, Button, TextField } from '@mui/material';
import type { UseFormReturn } from 'react-hook-form';
import type { SignInFormValues } from '../authSchemas';

export function WelcomeAuthSignInForm({
  form,
  submitting,
  onSubmit,
}: {
  form: UseFormReturn<SignInFormValues>;
  submitting: boolean;
  onSubmit: () => void;
}) {
  const { errors } = form.formState;
  return (
    <Box component="form" onSubmit={onSubmit} noValidate>
      <TextField
        label="Username or email"
        fullWidth
        margin="dense"
        autoComplete="username"
        disabled={submitting}
        error={Boolean(errors.username)}
        helperText={errors.username?.message}
        {...form.register('username')}
      />
      <TextField
        label="Password"
        type="password"
        fullWidth
        margin="dense"
        autoComplete="current-password"
        disabled={submitting}
        error={Boolean(errors.password)}
        helperText={errors.password?.message}
        {...form.register('password')}
      />
      <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }} disabled={submitting}>
        Sign in
      </Button>
    </Box>
  );
}
