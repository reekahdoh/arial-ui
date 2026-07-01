import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { riskLevelCellSx } from '../../../constants/riskStatus';
import { riskReportSectionSx } from './riskReportStyles';
import type { OverallRiskAssessment } from './riskReportTypes';

function AssessmentLevelButton({
  level,
  label,
  onClick,
}: {
  level: string | null;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant="text"
      size="small"
      onClick={onClick}
      aria-label={`View ${label} details`}
      sx={(theme) => ({
        ...riskLevelCellSx(theme, level),
        minWidth: '100%',
        justifyContent: 'flex-start',
        borderRadius: 0,
        px: 2,
        py: 1,
        fontWeight: 700,
        textTransform: 'none',
        '&:hover': {
          bgcolor: riskLevelCellSx(theme, level).bgcolor,
          filter: 'brightness(0.95)',
        },
      })}
    >
      {level ?? 'UNKNOWN'}
    </Button>
  );
}

export function RiskReportOverallTable({
  risks,
  onViewAssessment,
  onViewMitigations,
}: {
  risks: OverallRiskAssessment[];
  onViewAssessment: (risk: OverallRiskAssessment) => void;
  onViewMitigations: (risk: OverallRiskAssessment) => void;
}) {
  return (
    <Box sx={riskReportSectionSx}>
      <Typography variant="h6" component="h2">
        Overall Risk Assessment
      </Typography>
      {risks.length > 0 ? (
        <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Table size="small" aria-label="Overall risk assessment">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Impact</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Likelihood</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Confidence</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Mitigations</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {risks.map((risk) => (
                <TableRow key={risk.key}>
                  <TableCell>{risk.name}</TableCell>
                  <TableCell>{risk.description ?? 'Not provided'}</TableCell>
                  <TableCell sx={{ p: 0 }}>
                    <AssessmentLevelButton
                      level={risk.impact}
                      label="impact"
                      onClick={() => onViewAssessment(risk)}
                    />
                  </TableCell>
                  <TableCell sx={{ p: 0 }}>
                    <AssessmentLevelButton
                      level={risk.likelihood}
                      label="likelihood"
                      onClick={() => onViewAssessment(risk)}
                    />
                  </TableCell>
                  <TableCell>{risk.score ?? 'UNKNOWN'}</TableCell>
                  <TableCell>
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => onViewMitigations(risk)}
                      disabled={risk.mitigations.length === 0}
                    >
                      {risk.mitigations.length > 0 ? 'View' : 'None'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No assessed risks were identified in this report.
        </Typography>
      )}
    </Box>
  );
}
