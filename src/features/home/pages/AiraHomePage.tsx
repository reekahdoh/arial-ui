import { Alert, Box, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppCTAButtonLink } from '../../../components/ui/AppCTAButton';
import { appCtaButton } from '../../../theme/tokens';

function readRegisteredMessage(state: unknown): string | null {
  if (state && typeof state === 'object' && 'registeredMessage' in state) {
    const message = (state as { registeredMessage: unknown }).registeredMessage;
    return typeof message === 'string' ? message : null;
  }
  return null;
}

export function AiraHomePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const registeredMessage = readRegisteredMessage(location.state);

  const dismissBanner = () => {
    navigate(location.pathname, { replace: true, state: {} });
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        width: '100%',
        pt: { xs: 2, sm: 4 },
        pb: 2,
        px: 2,
      }}
    >
      {registeredMessage ? (
        <Alert
          severity="success"
          sx={{ mb: 3, width: '100%', maxWidth: 480, alignSelf: 'center' }}
          onClose={dismissBanner}
        >
          {registeredMessage}
        </Alert>
      ) : null}

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'flex-start' },
          gap: { xs: 3, sm: 4 },
          width: '100%',
        }}
      >
        <Typography
          component="h1"
          sx={{
            fontSize: { xs: '1.125rem', sm: '1.25rem' },
            fontWeight: 600,
            letterSpacing: '0.02em',
            color: 'text.primary',
            textAlign: { xs: 'center', sm: 'left' },
            maxWidth: { sm: 520 },
            lineHeight: 1.35,
            flex: { sm: '1 1 auto' },
            minWidth: 0,
          }}
        >
          Making sense of AI Risk
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            maxWidth: appCtaButton.columnMaxWidth,
            gap: 2,
            alignSelf: { xs: 'center', sm: 'flex-end' },
            flexShrink: 0,
          }}
        >
          <AppCTAButtonLink to="/assessments/new" variant="contained" fullWidth>
            New Risk Assessment
          </AppCTAButtonLink>
          <AppCTAButtonLink to="/assessments" variant="outlined" fullWidth>
            View Risk Assessments
          </AppCTAButtonLink>
        </Box>
      </Box>
    </Box>
  );
}
