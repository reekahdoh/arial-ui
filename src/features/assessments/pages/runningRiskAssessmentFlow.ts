import type { User } from 'firebase/auth';
import type { MutableRefObject } from 'react';
import { resolveAuthenticatedUsername } from '../../../services/auth/resolveAuthenticatedUsername';
import { ASSESSMENT_ANSWER_POLL_DELAY_MS, ASSESSMENT_BEING_PREPARED_STATUS, delay, isAbortError } from './assessmentPageShared';
import {
  buildAssessmentRiskRequestBody,
  buildAssessmentRiskRequestUrl,
  postAssessmentRiskWithBetterNetworkError,
  type AssessmentRiskExchangeLogEntry,
  type AssessmentRiskRequestLog,
  type AssessmentRiskResult,
} from './assessingRiskAssessmentApi';
import {
  assertAiResult,
  buildAssessmentAiRequestBody,
  buildAssessmentAiRequestUrl,
  logAiResponse,
} from './preparingRiskAssessmentApi';
import {
  processAssessmentAnswerResult,
  type RunningAssessmentAnswerResult,
  type RunningFlowSetters,
} from './runningAssessmentAnswerProcessing';

export type { RunningAssessmentAnswerResult, RunningFlowSetters };

export const PREPARING_ANSWER_STATUS =
  "Thanks. Please be patient - there's a lot to do here.\n\nWe're reviewing your response, and your requirements within the specified domain, to identify where AI can be used to meet your needs.";

export const RISK_ANSWER_STATUS =
  "Please be patient while we process your response.\n\nWe're looking to fully underdstand your requirements and the risks involved in using AI to meet those requirements.\n\nThis may take a few minutes.";

function responseLog(result: AssessmentRiskResult) {
  return {
    ok: result.ok,
    httpStatus: result.status,
    raw: result.raw,
    json: result.data ? JSON.stringify(result.data, null, 2) : null,
  };
}

function updateFailedExchange(entries: AssessmentRiskExchangeLogEntry[], key: string, err: unknown) {
  if (isAbortError(err)) return entries.filter((entry) => entry.key !== key);
  return entries.map((entry) =>
    entry.key === key ? { ...entry, error: err instanceof Error ? err.message : 'assessment answer request failed.' } : entry,
  );
}

export async function pollUntilQuestionOrComplete({
  assessmentId,
  user,
  signal,
  questionIdRef,
  hasStartedRiskPhaseRef,
  setters,
}: {
  assessmentId: string;
  user: User;
  signal: AbortSignal;
  questionIdRef: MutableRefObject<string | null>;
  hasStartedRiskPhaseRef: MutableRefObject<boolean>;
  setters: RunningFlowSetters;
}): Promise<RunningAssessmentAnswerResult> {
  setters.setIsAwaitingQuestion(true);
  setters.setStatus(ASSESSMENT_BEING_PREPARED_STATUS);

  while (!signal.aborted) {
    await delay(ASSESSMENT_ANSWER_POLL_DELAY_MS);
    const result = await sendRunningAssessmentAnswer({
      assessmentId,
      user,
      message: '',
      signal,
      questionIdRef,
      hasStartedRiskPhaseRef,
      setters,
      skipPollOnNull: true,
    });
    if (result.completed || !result.stillAwaiting) return result;
  }

  return { needsRiskKickoff: false, completed: false, stillAwaiting: true };
}

export async function sendRunningAssessmentAnswer({
  assessmentId,
  user,
  message,
  signal,
  questionIdRef,
  hasStartedRiskPhaseRef,
  setters,
  skipPollOnNull = false,
}: {
  assessmentId: string;
  user: User;
  message: string;
  signal: AbortSignal;
  questionIdRef: MutableRefObject<string | null>;
  hasStartedRiskPhaseRef: MutableRefObject<boolean>;
  setters: RunningFlowSetters;
  skipPollOnNull?: boolean;
}): Promise<RunningAssessmentAnswerResult> {
  const trimmedAssessmentId = assessmentId.trim();
  if (!trimmedAssessmentId) throw new Error('Cannot run assessment: missing assessment id.');
  if (!user) throw new Error('Cannot run assessment: missing authenticated user.');

  const userId = await resolveAuthenticatedUsername(user);
  const questionId = questionIdRef.current;
  const requestOptions = { userId, message, questionId };
  const requestBody = buildAssessmentRiskRequestBody(userId, message, questionId);
  const url = buildAssessmentRiskRequestUrl(trimmedAssessmentId, userId, message, questionId);
  const key = `${Date.now()}-${message.length}`;
  const request: AssessmentRiskRequestLog = {
    method: 'POST',
    url,
    assessmentId: trimmedAssessmentId,
    userId,
    message,
    bodySummary: JSON.stringify(requestBody, null, 2),
  };
  setters.setExchangeLog((prev) => [...prev, { key, request, response: null, error: null }]);

  let result: AssessmentRiskResult;
  try {
    result = await postAssessmentRiskWithBetterNetworkError(url, signal, requestOptions);
  } catch (err) {
    setters.setExchangeLog((prev) => updateFailedExchange(prev, key, err));
    throw err;
  }

  setters.setExchangeLog((prev) =>
    prev.map((entry) => (entry.key === key ? { ...entry, response: responseLog(result) } : entry)),
  );
  if (!result.ok) throw new Error(`assessment answer returned ${result.status}: ${result.raw || '(empty response)'}`);

  const data = assertAiResult(result);
  logAiResponse(
    setters.setAiIdResponseLog,
    data,
    result.status,
    url,
    JSON.stringify(buildAssessmentAiRequestBody(userId, message, questionId), null, 2),
  );

  const outcome = processAssessmentAnswerResult(
    result,
    hasStartedRiskPhaseRef,
    setters,
    questionIdRef,
    trimmedAssessmentId,
  );

  if (outcome.stillAwaiting && !skipPollOnNull) {
    return pollUntilQuestionOrComplete({
      assessmentId,
      user,
      signal,
      questionIdRef,
      hasStartedRiskPhaseRef,
      setters,
    });
  }

  return outcome;
}

export async function processInitialAssessmentResponse({
  assessmentId,
  user,
  response,
  signal,
  questionIdRef,
  hasStartedRiskPhaseRef,
  setters,
}: {
  assessmentId: string;
  user: User;
  response: AssessmentRiskResult;
  signal: AbortSignal;
  questionIdRef: MutableRefObject<string | null>;
  hasStartedRiskPhaseRef: MutableRefObject<boolean>;
  setters: RunningFlowSetters;
}): Promise<RunningAssessmentAnswerResult> {
  if (!response.ok) {
    throw new Error(`assessment answer returned ${response.status}: ${response.raw || '(empty response)'}`);
  }

  const outcome = processAssessmentAnswerResult(
    response,
    hasStartedRiskPhaseRef,
    setters,
    questionIdRef,
    assessmentId.trim(),
  );

  if (outcome.stillAwaiting) {
    return pollUntilQuestionOrComplete({
      assessmentId,
      user,
      signal,
      questionIdRef,
      hasStartedRiskPhaseRef,
      setters,
    });
  }

  return outcome;
}

export async function kickoffRiskPhase({
  assessmentId,
  user,
  signal,
  questionIdRef,
  hasStartedRiskPhaseRef,
  setters,
}: {
  assessmentId: string;
  user: User;
  signal: AbortSignal;
  questionIdRef: MutableRefObject<string | null>;
  hasStartedRiskPhaseRef: MutableRefObject<boolean>;
  setters: RunningFlowSetters;
}) {
  hasStartedRiskPhaseRef.current = true;
  setters.setStatus('Working to understand the level of risk...');
  await sendRunningAssessmentAnswer({
    assessmentId,
    user,
    message: '',
    signal,
    questionIdRef,
    hasStartedRiskPhaseRef,
    setters,
  });
}

export function buildInitialAnswerUrl(assessmentId: string, userId: string) {
  return buildAssessmentAiRequestUrl(assessmentId, userId);
}
