import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { AppCard } from '../../../components/ui/AppCard';
import { PageHeader } from '../../../components/ui/PageHeader';
import { AssessmentQuestionAnswerContent } from './AssessmentQuestionAnswerContent';
import { useRunningRiskAssessment } from './useRunningRiskAssessment';

export function RunningRiskAssessmentPage() {
  const state = useRunningRiskAssessment();
  const completionAction = state.showNextButton
    ? { label: 'Next', onClick: state.enterQa, startIcon: <PlayArrowIcon /> }
    : null;

  return (
    <>
      <PageHeader
        title="Preparing Your Risk Assessment"
        description="Here we'll consider the Authoritative References for this domain and dig deeper into what your requirements are."
        descriptionVariant="body1"
        descriptionSx={{ fontSize: '1rem', lineHeight: 1.45 }}
      />
      <AppCard>
        <AssessmentQuestionAnswerContent
          answer={state.answer}
          completionAction={completionAction}
          error={state.error}
          isSubmittingAnswer={state.isSubmittingAnswer}
          progressAriaLabel="Risk assessment progress"
          progressPercent={null}
          question={state.question}
          showAnswerForm={state.showAnswerForm}
          status={state.status}
          alwaysShowStatus
          setAnswer={state.setAnswer}
          submitAnswer={() => void state.submitAnswer()}
        />
      </AppCard>
    </>
  );
}
