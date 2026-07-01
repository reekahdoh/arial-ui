import type { User } from 'firebase/auth';
import type { MutableRefObject } from 'react';
import { resolveAuthenticatedUsername } from '../../../services/auth/resolveAuthenticatedUsername';
import { assertAiResult, buildAssessmentAiRequestBody, logAiResponse, postAssessmentAiJson } from './preparingRiskAssessmentApi';
import { pollUntilRequirementsIngestReady } from './requirementsIngestPolling';
import {
  buildInitialAnswerUrl,
  kickoffRiskPhase,
  processInitialAssessmentResponse,
  type RunningFlowSetters,
} from './runningRiskAssessmentFlow';

export async function loadInitialRunningAssessment({
  assessmentId,
  user,
  signal,
  flowSetters,
  questionIdRef,
  hasStartedRiskPhaseRef,
  setStatus,
}: {
  assessmentId: string;
  user: User;
  signal: AbortSignal;
  flowSetters: RunningFlowSetters;
  questionIdRef: MutableRefObject<string | null>;
  hasStartedRiskPhaseRef: MutableRefObject<boolean>;
  setStatus: (status: string) => void;
}): Promise<void> {
  if (!assessmentId.trim()) throw new Error('Cannot run assessment: missing assessment id.');

  setStatus('Please wait whilst we prepare the materials...');
  const userId = await resolveAuthenticatedUsername(user);

  await pollUntilRequirementsIngestReady(assessmentId, signal, flowSetters);

  const url = buildInitialAnswerUrl(assessmentId, userId);
  const response = await postAssessmentAiJson(url, signal, { userId });

  const data = assertAiResult(response);
  logAiResponse(
    flowSetters.setAiIdResponseLog,
    data,
    response.status,
    url,
    JSON.stringify(buildAssessmentAiRequestBody(userId), null, 2),
  );

  const { needsRiskKickoff, completed } = await processInitialAssessmentResponse({
    assessmentId,
    user,
    response,
    signal,
    questionIdRef,
    hasStartedRiskPhaseRef,
    setters: flowSetters,
  });

  if (needsRiskKickoff && !completed) {
    await kickoffRiskPhase({
      assessmentId,
      user,
      signal,
      questionIdRef,
      hasStartedRiskPhaseRef,
      setters: flowSetters,
    });
  }
}
