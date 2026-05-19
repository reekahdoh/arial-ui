import { AssessmentQuestionAnswerContent } from './AssessmentQuestionAnswerContent';
import type { RiskReportPayload } from './assessingRiskAssessmentApi';

export function AssessingRiskAssessmentContent({
  answer,
  error,
  isComplete,
  isFirstResponseReady,
  isSubmittingAnswer,
  progressPercent,
  question,
  riskReport,
  status,
  openRiskReport,
  setAnswer,
  submitAnswer,
}: {
  answer: string;
  error: string | null;
  isComplete: boolean;
  isFirstResponseReady: boolean;
  isSubmittingAnswer: boolean;
  progressPercent: number | null;
  question: string | null;
  riskReport: RiskReportPayload | null;
  status: string;
  openRiskReport: () => void;
  setAnswer: (answer: string) => void;
  submitAnswer: () => void;
}) {
  const showAnswerForm = !error && isFirstResponseReady && !isComplete && !isSubmittingAnswer;
  const completionAction = !error && isComplete ? { label: 'Read The Report', onClick: openRiskReport, disabled: !riskReport } : null;

  return (
    <AssessmentQuestionAnswerContent
      answer={answer}
      completionAction={completionAction}
      error={error}
      isSubmittingAnswer={isSubmittingAnswer}
      progressAriaLabel="Risk assessment progress"
      progressPercent={progressPercent}
      question={question}
      showAnswerForm={showAnswerForm}
      status={status}
      setAnswer={setAnswer}
      submitAnswer={submitAnswer}
    />
  );
}
