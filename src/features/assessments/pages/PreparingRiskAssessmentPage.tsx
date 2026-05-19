import { Box } from '@mui/material';
import { AppCard } from '../../../components/ui/AppCard';
import { PageHeader } from '../../../components/ui/PageHeader';
import { AssessmentQuestionAnswerContent } from './AssessmentQuestionAnswerContent';
import { useAssessmentIdFromRoute } from './assessmentPageShared';
import { PreparingRiskAssessmentDiagnostics } from './PreparingRiskAssessmentDiagnostics';
import { usePreparingRiskAssessment } from './usePreparingRiskAssessment';

export function PreparingRiskAssessmentPage() {
  const assessmentId = useAssessmentIdFromRoute();
  const state = usePreparingRiskAssessment(assessmentId);
  const showDiagnostics = Boolean(assessmentId.trim()) || state.aiIdResponseLog.length > 0;

  return (
    <>
      <PageHeader
        title="Preparing Your Risk Assessment"
        description={
          "Here we'll consider the Authoritative References for this domain and to understand what AI you are using.\nPlease answer the following questions to help us really understand what you're trying to do. This will help us prepare everything for the final risk assessment."
        }
        descriptionVariant="body1"
        descriptionSx={{ fontSize: '1rem', lineHeight: 1.45 }}
      />
      <AppCard>
        <AssessmentQuestionAnswerContent
          answer={state.answer}
          completionAction={state.completionAction}
          error={state.error}
          isSubmittingAnswer={state.isSubmittingAnswer}
          progressAriaLabel="Risk assessment preparation progress"
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
            <PreparingRiskAssessmentDiagnostics assessmentId={assessmentId} aiIdResponseLog={state.aiIdResponseLog} />
          </Box>
        </AppCard>
      ) : null}
    </>
  );
}
