import { Alert, Box } from '@mui/material';
import { AppCTAButtonLink } from '../../../components/ui/AppCTAButton';
import { PageHeader } from '../../../components/ui/PageHeader';
import { appCtaButtonTrackSx } from '../../../theme/tokens';
import { AssessmentsListTable } from './AssessmentsListTable';
import { useAssessmentsList } from './useAssessmentsList';

export function AssessmentsListPage() {
  const list = useAssessmentsList();

  return (
    <>
      <PageHeader
        title="Risk Assessments"
        description="The list of all Risk Assessments created by your organisation."
        actions={
          <Box sx={appCtaButtonTrackSx}>
            <AppCTAButtonLink to="/assessments/new" variant="contained" color="primary" fullWidth>
              New Assessment
            </AppCTAButtonLink>
          </Box>
        }
      />
      {list.deleteError ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => list.setDeleteError(null)}>
          {list.deleteError}
        </Alert>
      ) : null}
      {list.loadError ? (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => list.setLoadError(null)}>
          {list.loadError}
        </Alert>
      ) : null}
      <AssessmentsListTable
        rows={list.rows}
        loading={list.loading}
        statusByRowId={list.statusByRowId}
        deletingRowId={list.deletingRowId}
        onDelete={(row) => void list.handleDelete(row)}
      />
    </>
  );
}
