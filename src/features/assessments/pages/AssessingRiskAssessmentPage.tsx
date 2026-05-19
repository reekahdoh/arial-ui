import { Box } from '@mui/material';
import { AppCard } from '../../../components/ui/AppCard';
import { PageHeader } from '../../../components/ui/PageHeader';
import { AssessingRiskAssessmentContent } from './AssessingRiskAssessmentContent';
import { AssessingRiskAssessmentDiagnostics } from './AssessingRiskAssessmentDiagnostics';
import { useAssessmentIdFromRoute } from './assessmentPageShared';
import { useAssessingRiskAssessment } from './useAssessingRiskAssessment';

export function AssessingRiskAssessmentPage() {
  const assessmentId = useAssessmentIdFromRoute();
  const riskState = useAssessingRiskAssessment(assessmentId);
  const showDiagnostics = Boolean(assessmentId.trim()) || riskState.riskExchangeLog.length > 0;

  return (
    <>
      <PageHeader
        title="Assessing Risk"
        description="Working to understand the level of risk in the system you are procuring or building."
        descriptionVariant="body1"
        descriptionSx={{ fontSize: '1rem', lineHeight: 1.45 }}
      />
      <AppCard>
        <AssessingRiskAssessmentContent
          answer={riskState.answer}
          error={riskState.error}
          isComplete={riskState.isComplete}
          isFirstResponseReady={riskState.isFirstResponseReady}
          isSubmittingAnswer={riskState.isSubmittingAnswer}
          progressPercent={riskState.progressPercent}
          question={riskState.question}
          riskReport={riskState.riskReport}
          status={riskState.status}
          openRiskReport={riskState.openRiskReport}
          setAnswer={riskState.setAnswer}
          submitAnswer={() => void riskState.submitAnswer()}
        />
      </AppCard>
      {showDiagnostics ? (
        <AppCard sx={{ mt: 2 }}>
          <Box sx={{ width: '100%', maxWidth: 720, mx: 'auto' }}>
            <AssessingRiskAssessmentDiagnostics assessmentId={assessmentId} riskExchangeLog={riskState.riskExchangeLog} />
          </Box>
        </AppCard>
      ) : null}
    </>
  );
}
