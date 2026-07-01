import { Box, Typography } from '@mui/material';
import { AppCTAButtonLink } from '../../../components/ui/AppCTAButton';
import { appCtaButton } from '../../../theme/tokens';

export function AiraHomePage() {
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
