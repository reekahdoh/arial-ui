import { Box, Typography } from '@mui/material';
import { RiskReportInsetPanel } from './RiskReportInsetPanel';
import { RiskReportOverallTable } from './RiskReportOverallTable';
import { RiskReportPriorityRisksSection } from './RiskReportPriorityRisksSection';
import type { OverallRiskAssessment, RiskReportViewModel } from './riskReportTypes';

export function RiskReportSummaryView({
  viewModel,
  onViewAssessment,
  onViewMitigations,
}: {
  viewModel: RiskReportViewModel;
  onViewAssessment: (risk: OverallRiskAssessment) => void;
  onViewMitigations: (risk: OverallRiskAssessment) => void;
}) {
  return (
    <>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}>
        <RiskReportInsetPanel label="Name">
          <Typography variant="body1" sx={{ fontSize: '1.125rem', fontWeight: 700 }}>
            {viewModel.reportName}
          </Typography>
        </RiskReportInsetPanel>
        <RiskReportInsetPanel label="Description">
          <Typography variant="body1" sx={{ fontSize: '1.125rem', fontWeight: 700 }}>
            {viewModel.reportDescription}
          </Typography>
        </RiskReportInsetPanel>
      </Box>

      <RiskReportInsetPanel label="Requirements Summary">
        <Typography variant="body1" sx={{ fontSize: '1.125rem' }}>
          {viewModel.requirementSummary}
        </Typography>
      </RiskReportInsetPanel>

      <RiskReportInsetPanel label="Requirements Contradictions">
        {viewModel.requirementContradictions.length > 0 ? (
          <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
            {viewModel.requirementContradictions.map((contradiction) => (
              <Box component="li" key={contradiction} sx={{ mb: 0.75 }}>
                <Typography variant="body1" component="span" sx={{ fontSize: '1.125rem' }}>
                  {contradiction}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : null}
      </RiskReportInsetPanel>

      <RiskReportInsetPanel label="Gaps in Requirements">
        {viewModel.requirementGaps.length > 0 ? (
          <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
            {viewModel.requirementGaps.map((gap) => (
              <Box component="li" key={gap} sx={{ mb: 0.75 }}>
                <Typography variant="body1" component="span" sx={{ fontSize: '1.125rem' }}>
                  {gap}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography variant="body1" sx={{ fontSize: '1.125rem' }}>
            No gaps in requirements provided.
          </Typography>
        )}
      </RiskReportInsetPanel>

      <RiskReportOverallTable
        risks={viewModel.overallRiskAssessments}
        onViewAssessment={onViewAssessment}
        onViewMitigations={onViewMitigations}
      />

      <RiskReportPriorityRisksSection
        title="Your highest priority risks are"
        risks={viewModel.highestPriorityRisks}
        emptyMessage="No high risks were identified in this report."
        showImpact
      />

      <RiskReportPriorityRisksSection
        title="Your lower priority risks are"
        risks={viewModel.lowerPriorityRisks}
        emptyMessage="No low risks were identified in this report."
        showImpact={false}
      />

      <RiskReportInsetPanel label="Completed At">
        <Typography variant="body2">
          {viewModel.completedAt ? new Date(viewModel.completedAt).toLocaleString() : 'Not available'}
        </Typography>
      </RiskReportInsetPanel>
    </>
  );
}
