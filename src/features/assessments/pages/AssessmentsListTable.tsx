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
import { riskLevelBandFromLabel, riskLevelMainColor } from '../../../constants/riskStatus';
import type { RiskAssessmentRead } from '../../../services/assessments/firestoreRiskAssessments';
import { formatShortDate } from '../../../utils/formatDate';
import {
  assessmentStatusLabel,
  getAssessmentId,
  isCompletedAssessmentStatus,
  type AssessmentStatusState,
} from './assessmentsListHelpers';

/** Hide table columns below `sm` — keeps the list readable on narrow viewports. */
const hideBelowSm = { display: { xs: 'none', sm: 'table-cell' } } as const;
/** Hide score columns until there is room for the full table. */
const hideBelowMd = { display: { xs: 'none', md: 'table-cell' } } as const;

const titleCellSx = {
  maxWidth: { xs: 160, sm: 220, md: 320 },
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
} as const;

const idCellSx = {
  maxWidth: 180,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontFamily: 'monospace',
  fontSize: '0.8125rem',
} as const;

const compactCellSx = { whiteSpace: 'nowrap' } as const;
const iconCellSx = { width: 48, px: 0.5, whiteSpace: 'nowrap' } as const;

function RiskLevelCell({ value, isLoading }: { value: string | null | undefined; isLoading?: boolean }) {
  const label = isLoading ? 'Loading...' : value ?? '—';

  return (
    <Typography
      variant="data"
      sx={(theme) =>
        value
          ? {
              color: riskLevelMainColor(theme, riskLevelBandFromLabel(value)),
              fontWeight: 600,
            }
          : {}
      }
    >
      {label}
    </Typography>
  );
}

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
  const riskImpact = statusState?.riskImpact;
  const riskLikelihood = statusState?.riskLikelihood;
  const isLoadingScores = statusState?.isLoading;

  return (
    <TableRow hover>
      <TableCell sx={titleCellSx}>
        <Typography variant="dataEmphasis" component="p" sx={{ mb: 0.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {assessmentId ? (
            <Link
              component={RouterLink}
              to={`/assessments/new?assessmentId=${encodeURIComponent(assessmentId)}`}
              underline="hover"
              color="inherit"
              sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {row.title}
            </Link>
          ) : (
            row.title
          )}
        </Typography>
      </TableCell>
      <TableCell sx={{ ...hideBelowSm, ...idCellSx }}>
        <Typography variant="data">{assessmentId || '—'}</Typography>
      </TableCell>
      <TableCell sx={hideBelowSm}>
        <Typography variant="data" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {row.ownerName}
        </Typography>
      </TableCell>
      <TableCell sx={{ ...hideBelowSm, ...compactCellSx }}>
        <Typography variant="data">{formatShortDate(row.updatedAt)}</Typography>
      </TableCell>
      <TableCell sx={{ ...hideBelowMd, ...compactCellSx }}>
        <RiskLevelCell value={riskImpact} isLoading={isLoadingScores} />
      </TableCell>
      <TableCell sx={{ ...hideBelowMd, ...compactCellSx }}>
        <RiskLevelCell value={riskLikelihood} isLoading={isLoadingScores} />
      </TableCell>
      <TableCell sx={compactCellSx}>
        <Typography variant="data">{assessmentStatusLabel(assessmentId, statusState)}</Typography>
      </TableCell>
      <TableCell align="center" sx={iconCellSx}>
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
      <TableCell align="center" sx={iconCellSx}>
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
    <AppTable aria-label="Risk Assessments" tableProps={{ sx: { minWidth: { xs: 0, md: 720 } } }}>
      <TableHead>
        <TableRow>
          <TableCell>Title</TableCell>
          <TableCell sx={hideBelowSm}>Assessment ID</TableCell>
          <TableCell sx={hideBelowSm}>Owner</TableCell>
          <TableCell sx={hideBelowSm}>Updated</TableCell>
          <TableCell sx={hideBelowMd}>Risk Impact</TableCell>
          <TableCell sx={hideBelowMd}>Risk Likelihood</TableCell>
          <TableCell>Status</TableCell>
          <TableCell align="center" sx={iconCellSx}>
            Report
          </TableCell>
          <TableCell align="center" sx={iconCellSx}>
            Actions
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={9}>
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
