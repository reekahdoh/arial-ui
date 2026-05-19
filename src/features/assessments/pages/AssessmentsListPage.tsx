import { Alert, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { AppCard } from '../../../components/ui/AppCard';
import { PageHeader } from '../../../components/ui/PageHeader';
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
          <Button component={RouterLink} to="/assessments/new" variant="contained" color="primary" size="small">
            New assessment
          </Button>
        }
      />
      <AppCard>
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
      </AppCard>
    </>
  );
}
