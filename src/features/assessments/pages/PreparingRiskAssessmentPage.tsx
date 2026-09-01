import { useEffect } from 'react';
import { Box } from '@mui/material';
import { AppCard } from '../../../components/ui/AppCard';
import { PageHeader } from '../../../components/ui/PageHeader';
import { AssessmentQuestionAnswerContent } from './AssessmentQuestionAnswerContent';
import { AssessingRiskAssessmentDiagnostics } from './AssessingRiskAssessmentDiagnostics';
import { useAssessmentIdFromRoute } from './assessmentPageShared';
import { useRunningRiskAssessment } from './useRunningRiskAssessment';

const PREPARING_PHASE_DESCRIPTION =
  "Here we'll consider the Authoritative References for this domain and understand what AI you are using.\nPlease answer the following questions so we can identify where AI can be used and assess the level of risk involved.";

const RISK_PHASE_DESCRIPTION =
  'Working to understand the level of risk in the system you are procuring or building.';

function descriptionForProgress(progressPercent: number | null): string {
  return (progressPercent ?? 0) >= 50 ? RISK_PHASE_DESCRIPTION : PREPARING_PHASE_DESCRIPTION;
}

export function PreparingRiskAssessmentPage() {
  const assessmentId = useAssessmentIdFromRoute();
  const state = useRunningRiskAssessment(assessmentId);
  const showDiagnostics = Boolean(assessmentId.trim()) || state.exchangeLog.length > 0;

  useEffect(() => {
    if (!state.question) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [state.question]);

  return (
    <>
      <PageHeader
        title="Your Risk Assessment"
        description={descriptionForProgress(state.progressPercent)}
        descriptionVariant="body1"
        descriptionSx={{ fontSize: '1rem', lineHeight: 1.45 }}
      />
      <AppCard>
        <AssessmentQuestionAnswerContent
          aiStage={state.aiStage}
          answer={state.answer}
          completionAction={state.completionAction}
          error={state.error}
          isSubmittingAnswer={state.isSubmittingAnswer}
          options={state.options}
          progressAriaLabel="Risk assessment progress"
          progressPercent={state.progressPercent}
          question={state.question}
          showAnswerForm={state.showAnswerForm}
          status={state.status}
          setAnswer={state.setAnswer}
          submitAnswer={() => void state.submitAnswer()}
        />
      </AppCard>
      {showDiagnostics ? (
        <AppCard sx={{ mt: 2 }}>
          <Box sx={{ width: '100%', maxWidth: 720, mx: 'auto' }}>
            <AssessingRiskAssessmentDiagnostics assessmentId={assessmentId} riskExchangeLog={state.exchangeLog} />
          </Box>
        </AppCard>
      ) : null}
    </>
  );
}
