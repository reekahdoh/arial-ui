import { AppCard } from '../../../components/ui/AppCard';
import { RiskReportBody } from './RiskReportBody';
import { RiskReportMitigationsDialog } from './RiskReportMitigationsDialog';
import { RiskReportPageHeader } from './RiskReportPageHeader';
import { useRiskReportPage } from './useRiskReportPage';

export function RiskReportPage() {
  const report = useRiskReportPage();

  return (
    <>
      <RiskReportPageHeader
        assessmentId={report.assessmentId}
        authLoading={report.authLoading}
        detailedReport={report.detailedReport}
        onGenerate={() => void report.generateDetailedReport()}
        onView={report.viewDetailedReport}
      />
      <AppCard>
        <RiskReportBody
          assessmentId={report.assessmentId}
          apiReport={report.apiReport}
          detailedReport={report.detailedReport}
          viewModel={report.viewModel}
          onViewMitigations={report.setSelectedMitigationRisk}
        />
      </AppCard>
      <RiskReportMitigationsDialog risk={report.selectedMitigationRisk} onClose={() => report.setSelectedMitigationRisk(null)} />
    </>
  );
}
