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

export function RiskReportOverallTable({
  risks,
  onViewMitigations,
}: {
  risks: OverallRiskAssessment[];
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
                <TableCell sx={{ fontWeight: 700 }}>Mitigations</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {risks.map((risk) => (
                <TableRow key={risk.key}>
                  <TableCell>{risk.name}</TableCell>
                  <TableCell>{risk.description ?? 'Not provided'}</TableCell>
                  <TableCell sx={(theme) => riskLevelCellSx(theme, risk.impact)}>{risk.impact ?? 'UNKNOWN'}</TableCell>
                  <TableCell sx={(theme) => riskLevelCellSx(theme, risk.likelihood)}>
                    {risk.likelihood ?? 'UNKNOWN'}
                  </TableCell>
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
