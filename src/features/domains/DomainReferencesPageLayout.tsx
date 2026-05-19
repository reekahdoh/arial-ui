import { Box, Button } from '@mui/material';
import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { AppCTAButtonLink } from '../../components/ui/AppCTAButton';
import { PageHeader } from '../../components/ui/PageHeader';
import { appCtaButtonTrackSx } from '../../theme/tokens';

export function DomainReferencesPageLayout({
  title,
  description,
  backTo,
  addLabel,
  addTo,
  addState,
  children,
}: {
  title: string;
  description: ReactNode;
  backTo: string;
  addLabel: string;
  addTo: string;
  addState?: object;
  children: ReactNode;
}) {
  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={
          <>
            <Button component={RouterLink} to={backTo} variant="outlined" size="small">
              Back
            </Button>
            <Box sx={appCtaButtonTrackSx}>
              <AppCTAButtonLink variant="contained" fullWidth to={addTo} state={addState}>
                {addLabel}
              </AppCTAButtonLink>
            </Box>
          </>
        }
      />
      {children}
    </>
  );
}
