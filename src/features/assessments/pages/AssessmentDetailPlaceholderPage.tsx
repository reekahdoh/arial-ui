import { Box, Button, Typography } from '@mui/material';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { AppCard } from '../../../components/ui/AppCard';
import { PageHeader } from '../../../components/ui/PageHeader';
import { getLocalAssessment } from '../../../services/assessments/localAssessments';
/** Minimal route target so list links resolve; full detail scaffold comes in the next batch. */
export function AssessmentDetailPlaceholderPage() {
  const { assessmentId } = useParams();
  const local = assessmentId ? getLocalAssessment(assessmentId) : null;

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
          {local ? (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Owner
              </Typography>
              <Typography variant="data">{local.draft.owner || '—'}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Company Name
              </Typography>
              <Typography variant="data">{local.draft.companyName || '—'}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Domain
              </Typography>
              <Typography variant="data">{local.draft.domain === 'ai' ? 'AI' : 'WHO'}</Typography>
            </>
          ) : null}
        </Box>
      </AppCard>
    </>
  );
}
