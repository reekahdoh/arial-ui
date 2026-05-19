import { Alert, Box, Typography } from '@mui/material';
import type { DetailedReportState, OverallRiskAssessment, ReportSource, RiskReportViewModel } from './riskReportTypes';
import { RiskReportSummaryView } from './RiskReportSummaryView';

export function RiskReportBody({
  assessmentId,
  apiReport,
  detailedReport,
  viewModel,
  onViewMitigations,
}: {
  assessmentId: string;
  apiReport: ReportSource;
  detailedReport: DetailedReportState;
  viewModel: RiskReportViewModel | null;
  onViewMitigations: (risk: OverallRiskAssessment) => void;
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
      {detailedReport.error ? <Alert severity="error">{detailedReport.error}</Alert> : null}
      {detailedReport.success ? <Alert severity="success">{detailedReport.success}</Alert> : null}
      {!assessmentId.trim() ? (
        <Alert severity="warning">
          No assessment was specified. Open this page from an assessment to view its risk report.
        </Alert>
      ) : !viewModel && apiReport.isLoading ? (
        <Typography variant="body2" color="text.secondary">
          Loading report...
        </Typography>
      ) : !viewModel ? (
        <Alert severity="warning">{apiReport.error ?? 'No completed risk report was found for this assessment.'}</Alert>
      ) : (
        <RiskReportSummaryView viewModel={viewModel} onViewMitigations={onViewMitigations} />
      )}
    </Box>
  );
}
