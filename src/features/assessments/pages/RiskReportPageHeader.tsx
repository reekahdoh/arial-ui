import { Box, Button, Typography } from '@mui/material';
import { PageHeader } from '../../../components/ui/PageHeader';
import type { DetailedReportState } from './riskReportTypes';

export function RiskReportPageHeader({
  assessmentId,
  authLoading,
  detailedReport,
  onGenerate,
  onView,
}: {
  assessmentId: string;
  authLoading: boolean;
  detailedReport: DetailedReportState;
  onGenerate: () => void;
  onView: () => void;
}) {
  return (
    <PageHeader
      title="Your Risk Report"
      description={
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            justifyContent: 'space-between',
            gap: 1.5,
          }}
        >
          <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem', lineHeight: 1.45 }}>
            Here is your risk assessment overview.
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 1.5 }}>
            <Button
              variant="contained"
              onClick={onGenerate}
              disabled={
                !assessmentId.trim() ||
                authLoading ||
                detailedReport.isChecking ||
                detailedReport.isGenerating ||
                detailedReport.hasReport
              }
            >
              {detailedReport.isGenerating ? 'Generating...' : 'Generate Detailed Report'}
            </Button>
            <Button variant="outlined" onClick={onView} disabled={!detailedReport.hasReport || !detailedReport.viewUrl}>
              View Report
            </Button>
          </Box>
        </Box>
      }
      descriptionVariant="body1"
      descriptionSx={{ fontSize: '1rem', lineHeight: 1.45 }}
    />
  );
}
