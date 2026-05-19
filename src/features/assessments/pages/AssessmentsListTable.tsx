import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  IconButton,
  Link,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { AppTable } from '../../../components/ui/AppTable';
import { riskSeverityColor, riskSeverityLabels } from '../../../constants/riskStatus';
import type { RiskAssessmentRead } from '../../../services/assessments/firestoreRiskAssessments';
import { formatShortDate } from '../../../utils/formatDate';
import {
  assessmentStatusLabel,
  getAssessmentId,
  isCompletedAssessmentStatus,
  type AssessmentStatusState,
} from './assessmentsListHelpers';

function AssessmentListRow({
  row,
  statusState,
  deletingRowId,
  onDelete,
}: {
  row: RiskAssessmentRead;
  statusState: AssessmentStatusState | undefined;
  deletingRowId: string | null;
  onDelete: (row: RiskAssessmentRead) => void;
}) {
  const assessmentId = getAssessmentId(row);
  const backendStatus = statusState?.status;
  const reportAssessmentId = statusState?.assessmentId;

  return (
    <TableRow hover>
      <TableCell>
        <Typography variant="dataEmphasis" component="p" sx={{ mb: 0.25 }}>
          {assessmentId ? (
            <Link
              component={RouterLink}
              to={`/assessments/new?assessmentId=${encodeURIComponent(assessmentId)}`}
              underline="hover"
              color="inherit"
            >
              {row.title}
            </Link>
          ) : (
            row.title
          )}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="data">{assessmentId || '—'}</Typography>
      </TableCell>
      <TableCell>
        <Typography variant="data">{row.ownerName}</Typography>
      </TableCell>
      <TableCell>
        <Typography variant="data">{formatShortDate(row.updatedAt)}</Typography>
      </TableCell>
      <TableCell>
        <Typography
          variant="data"
          sx={(theme) => ({
            color: riskSeverityColor(theme, row.severity),
            fontWeight: 600,
          })}
        >
          {riskSeverityLabels[row.severity].toUpperCase()}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant="data">{assessmentStatusLabel(assessmentId, statusState)}</Typography>
      </TableCell>
      <TableCell align="center">
        {isCompletedAssessmentStatus(backendStatus) && reportAssessmentId ? (
          <Tooltip title="View report">
            <IconButton
              href={`/assessments/risk-report?assessmentId=${encodeURIComponent(reportAssessmentId)}`}
              size="small"
              aria-label={`View report for ${row.title}`}
              sx={{ color: 'text.primary', '&:hover': { color: 'text.primary', bgcolor: 'action.hover' } }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : null}
      </TableCell>
      <TableCell align="center">
        <Tooltip title="Delete assessment and associated data">
          <span>
            <IconButton
              size="small"
              aria-label={`Delete ${row.title}`}
              disabled={deletingRowId === row.id}
              onClick={() => onDelete(row)}
              sx={{ color: 'text.primary', '&:hover': { color: 'text.primary', bgcolor: 'action.hover' } }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}

export function AssessmentsListTable({
  rows,
  loading,
  statusByRowId,
  deletingRowId,
  onDelete,
}: {
  rows: RiskAssessmentRead[];
  loading: boolean;
  statusByRowId: Record<string, AssessmentStatusState>;
  deletingRowId: string | null;
  onDelete: (row: RiskAssessmentRead) => void;
}) {
  return (
    <AppTable aria-label="Risk Assessments">
      <TableHead>
        <TableRow>
          <TableCell>Title</TableCell>
          <TableCell>Assessment ID</TableCell>
          <TableCell>Owner</TableCell>
          <TableCell>Updated</TableCell>
          <TableCell>Severity</TableCell>
          <TableCell>Status</TableCell>
          <TableCell align="center">Report</TableCell>
          <TableCell align="center">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={8}>
              <Typography variant="body2" color="text.secondary">
                Loading risk assessments...
              </Typography>
            </TableCell>
          </TableRow>
        ) : null}
        {rows.map((row) => (
          <AssessmentListRow
            key={row.id}
            row={row}
            statusState={statusByRowId[row.id]}
            deletingRowId={deletingRowId}
            onDelete={onDelete}
          />
        ))}
      </TableBody>
    </AppTable>
  );
}
