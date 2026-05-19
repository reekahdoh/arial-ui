import { Box, Button, Typography } from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { AppCard } from '../../../components/ui/AppCard';
import { PageHeader } from '../../../components/ui/PageHeader';
/** Minimal route target so list links resolve; full detail scaffold comes in the next batch. */
export function AssessmentDetailPlaceholderPage() {
  const { assessmentId } = useParams();

  return (
    <>
      <PageHeader
        title="Assessment"
        description="Placeholder route for document-style detail once Firestore models and editors are in place."
        actions={
          <Button component={RouterLink} to="/assessments" variant="outlined" size="small">
            Back to list
          </Button>
        }
      />
      <AppCard title="Detail">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Assessment ID
          </Typography>
          <Typography variant="dataEmphasis">{assessmentId}</Typography>
        </Box>
      </AppCard>
    </>
  );
}
