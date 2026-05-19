import { Box, Button, TextField } from '@mui/material';
import type { UseFormReturn } from 'react-hook-form';
import type { RegisterFormValues } from '../authSchemas';

export function WelcomeAuthRegisterForm({
  form,
  submitting,
  onSubmit,
}: {
  form: UseFormReturn<RegisterFormValues>;
  submitting: boolean;
  onSubmit: () => void;
}) {
  const { errors } = form.formState;
  return (
    <Box component="form" onSubmit={onSubmit} noValidate>
      <TextField
        label="Email"
        type="email"
        fullWidth
        margin="dense"
        autoComplete="email"
        disabled={submitting}
        error={Boolean(errors.email)}
        helperText={errors.email?.message}
        {...form.register('email')}
      />
      <TextField
        label="Password"
        type="password"
        fullWidth
        margin="dense"
        autoComplete="new-password"
        disabled={submitting}
        error={Boolean(errors.password)}
        helperText={errors.password?.message}
        {...form.register('password')}
      />
      <TextField
        label="Confirm password"
        type="password"
        fullWidth
        margin="dense"
        autoComplete="new-password"
        disabled={submitting}
        error={Boolean(errors.confirmPassword)}
        helperText={errors.confirmPassword?.message}
        {...form.register('confirmPassword')}
      />
      <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }} disabled={submitting}>
        Create account
      </Button>
    </Box>
  );
}
