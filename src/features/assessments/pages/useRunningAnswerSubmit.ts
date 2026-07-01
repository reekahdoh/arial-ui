import { useCallback, type MutableRefObject } from 'react';
import type { User } from 'firebase/auth';
import { mapThrownError } from './assessmentPageShared';
import {
  kickoffRiskPhase,
  PREPARING_ANSWER_STATUS,
  RISK_ANSWER_STATUS,
  sendRunningAssessmentAnswer,
  type RunningFlowSetters,
} from './runningRiskAssessmentFlow';

export function useRunningAnswerSubmit({
  answer,
  assessmentId,
  error,
  flowSetters,
  hasStartedRiskPhaseRef,
  isComplete,
  isSubmittingAnswer,
  questionIdRef,
  setAnswer,
  setError,
  setIsFirstResponseReady,
  setIsSubmittingAnswer,
  setStatus,
  user,
}: {
  answer: string;
  assessmentId: string;
  error: string | null;
  flowSetters: RunningFlowSetters;
  hasStartedRiskPhaseRef: MutableRefObject<boolean>;
  isComplete: boolean;
  isSubmittingAnswer: boolean;
  questionIdRef: MutableRefObject<string | null>;
  setAnswer: (answer: string) => void;
  setError: (error: string | null) => void;
  setIsFirstResponseReady: (ready: boolean) => void;
  setIsSubmittingAnswer: (submitting: boolean) => void;
  setStatus: (status: string) => void;
  user: User | null;
}) {
  return useCallback(async () => {
    const trimmed = answer.trim();
    if (!trimmed || isSubmittingAnswer || error || isComplete || !user) return;

    const controller = new AbortController();
    setIsSubmittingAnswer(true);
    setStatus(hasStartedRiskPhaseRef.current ? RISK_ANSWER_STATUS : PREPARING_ANSWER_STATUS);

    try {
      const { needsRiskKickoff, completed } = await sendRunningAssessmentAnswer({
        assessmentId,
        user,
        message: trimmed,
        signal: controller.signal,
        questionIdRef,
        hasStartedRiskPhaseRef,
        setters: flowSetters,
      });
      setAnswer('');
      setIsFirstResponseReady(true);

      if (completed) return;

      if (needsRiskKickoff) {
        await kickoffRiskPhase({
          assessmentId,
          user,
          signal: controller.signal,
          questionIdRef,
          hasStartedRiskPhaseRef,
          setters: flowSetters,
        });
      }
    } catch (err) {
      const message = mapThrownError(err, 'Failed to submit answer.');
      if (message) setError(message);
    } finally {
      setIsSubmittingAnswer(false);
    }
  }, [
    answer,
    assessmentId,
    error,
    flowSetters,
    hasStartedRiskPhaseRef,
    isComplete,
    isSubmittingAnswer,
    questionIdRef,
    setAnswer,
    setError,
    setIsFirstResponseReady,
    setIsSubmittingAnswer,
    setStatus,
    user,
  ]);
}
