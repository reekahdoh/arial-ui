import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import type { ReactNode } from 'react';

const pageShellSx = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  bgcolor: 'background.default',
} as const;

export function WelcomeAuthLoadingScreen() {
  return (
    <Box sx={pageShellSx}>
      <CircularProgress size={28} />
    </Box>
  );
}

export function WelcomeAuthPageLayout({
  configured,
  formError,
  onDismissError,
  children,
}: {
  configured: boolean;
  formError: string | null;
  onDismissError: () => void;
  children: ReactNode;
}) {
  return (
    <Box sx={{ ...pageShellSx, px: 2, py: 4 }}>
      <Box sx={{ width: '100%', maxWidth: 420 }}>
        <Typography variant="h2" component="h1" sx={{ mb: 0.5, textAlign: 'center' }}>
          AIRA
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
          Risk assessments — sign in to continue
        </Typography>

        {!configured ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Set <Typography component="span" variant="captionStrong">REACT_APP_FIREBASE_*</Typography> in{' '}
            <Typography component="span" variant="captionStrong">.env</Typography> (see{' '}
            <Typography component="span" variant="captionStrong">.env.example</Typography>). For production, run{' '}
            <Typography component="span" variant="captionStrong">npm run build</Typography> then{' '}
            <Typography component="span" variant="captionStrong">firebase deploy --only hosting</Typography> — env
            files are not uploaded; values are baked into the build. Locally, restart the dev server after changing env.
          </Alert>
        ) : null}

        {formError ? (
          <Alert severity="error" sx={{ mb: 2 }} onClose={onDismissError}>
            {formError}
          </Alert>
        ) : null}

        {children}
      </Box>
    </Box>
  );
}
