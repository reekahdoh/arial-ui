import { Button, Link, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { AppCard } from '../../../components/ui/AppCard';
import { AppTable } from '../../../components/ui/AppTable';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatusChip } from '../../../components/ui/StatusChip';
import { workflowStatusLabels } from '../../../constants/riskStatus';
import { formatShortDate } from '../../../utils/formatDate';
import { mockAssessments } from '../api/mockAssessments';
import { readLocalAssessments } from '../../../services/assessments/localAssessments';
import { useMemo } from 'react';

export function AssessmentsListPage() {
  const rows = useMemo(() => {
    const local = readLocalAssessments();
    const merged = [...local, ...mockAssessments];
    merged.sort((a, b) => (a.updatedAt > b.updatedAt ? -1 : a.updatedAt < b.updatedAt ? 1 : 0));
    return merged;
  }, []);

  return (
    <>
      <PageHeader
        title="Risk Assessments"
        description="The list of all Risk Assessments created by your organisation."
        actions={
          <Button
            component={RouterLink}
            to="/assessments/new"
            variant="contained"
            color="primary"
            size="small"
          >
            New assessment
          </Button>
        }
      />
      <AppCard>
        <AppTable aria-label="Risk Assessments">
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell>Updated</TableCell>
              <TableCell>Severity</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>
                  <Typography variant="dataEmphasis" component="p" sx={{ mb: 0.25 }}>
                    <Link
                      component={RouterLink}
                      to={`/assessments/new?assessmentId=${encodeURIComponent(row.id)}`}
                      underline="hover"
                      color="inherit"
                    >
                      {row.title}
                    </Link>
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="data">{row.ownerName}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="data">{formatShortDate(row.updatedAt)}</Typography>
                </TableCell>
                <TableCell>
                  <StatusChip kind="severity" value={row.severity} />
                </TableCell>
                <TableCell>
                  <Typography variant="data">{workflowStatusLabels[row.workflowStatus]}</Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </AppTable>
      </AppCard>
    </>
  );
}
