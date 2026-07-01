import { useEffect, type MutableRefObject } from 'react';
import type { User } from 'firebase/auth';
import { isAbortError, mapThrownError } from './assessmentPageShared';
import { loadInitialRunningAssessment } from './initialRunningAssessmentLoad';
import type { RunningFlowSetters } from './runningRiskAssessmentFlow';

export function useInitialRunningAssessmentLoad({
  assessmentId,
  user,
  flowSetters,
  questionIdRef,
  hasStartedRiskPhaseRef,
  setError,
  setIsFirstResponseReady,
  setStatus,
}: {
  assessmentId: string;
  user: User | null;
  flowSetters: RunningFlowSetters;
  questionIdRef: MutableRefObject<string | null>;
  hasStartedRiskPhaseRef: MutableRefObject<boolean>;
  setError: (error: string | null) => void;
  setIsFirstResponseReady: (ready: boolean) => void;
  setStatus: (status: string) => void;
}) {
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    void (async () => {
      try {
        if (!assessmentId) throw new Error('Cannot run assessment: missing assessment id.');
        if (!user) throw new Error('Cannot run assessment: missing authenticated user.');

        await loadInitialRunningAssessment({
          assessmentId,
          user,
          signal: controller.signal,
          flowSetters,
          questionIdRef,
          hasStartedRiskPhaseRef,
          setStatus,
        });

        if (cancelled) return;
        setIsFirstResponseReady(true);
      } catch (err) {
        if (cancelled || isAbortError(err)) return;
        setError(mapThrownError(err, 'Failed to run risk assessment.'));
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [assessmentId, flowSetters, hasStartedRiskPhaseRef, questionIdRef, setError, setIsFirstResponseReady, setStatus, user]);
}
