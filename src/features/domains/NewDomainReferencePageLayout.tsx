import { Alert, Box, Button } from '@mui/material';
import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { AppCTAButton } from '../../components/ui/AppCTAButton';
import { AppCard } from '../../components/ui/AppCard';
import { PageHeader } from '../../components/ui/PageHeader';
import { appCtaButtonTrackSx } from '../../theme/tokens';

export function NewDomainReferencePageLayout({
  title,
  description,
  backTo,
  cancelLabel = 'Cancel',
  canSave,
  saving,
  error,
  onSave,
  children,
}: {
  title: string;
  description: ReactNode;
  backTo: string;
  cancelLabel?: string;
  canSave: boolean;
  saving: boolean;
  error: string | null;
  onSave: () => void;
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
              {cancelLabel}
            </Button>
            <Box sx={appCtaButtonTrackSx}>
              <AppCTAButton
                variant={canSave ? 'contained' : 'outlined'}
                fullWidth
                onClick={onSave}
                disabled={!canSave || saving}
              >
                {saving ? 'Saving…' : 'Save'}
              </AppCTAButton>
            </Box>
          </>
        }
      />
      <AppCard>
        {error ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}
        {children}
      </AppCard>
    </>
  );
}
