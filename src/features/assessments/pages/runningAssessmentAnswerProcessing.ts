import type { MutableRefObject } from 'react';
import { resolveOptions, resolveQuestionId } from './assessmentAnswerApi';
import { ASSESSMENT_BEING_PREPARED_STATUS, ASSESSMENT_REPORT_COMPLETE_STATUS } from './assessmentPageShared';
import {
  getRiskPrompt,
  getRiskReportStorageKey,
  isRiskComplete,
  progressPercentFromResponse,
  type AssessmentRiskExchangeLogEntry,
  type AssessmentRiskResult,
  type RiskReportPayload,
} from './assessingRiskAssessmentApi';

import { applyAiResponse, assertAiResult, isIdentifiedStage, type AiIdResponseLogEntry } from './preparingRiskAssessmentApi';

export type RunningFlowSetters = {
  setAiStage: (stage: string | null) => void;
  setError: (error: string | null) => void;
  setExchangeLog: (update: (prev: AssessmentRiskExchangeLogEntry[]) => AssessmentRiskExchangeLogEntry[]) => void;
  setIsAwaitingQuestion: (awaiting: boolean) => void;
  setIsComplete: (complete: boolean) => void;
  setOptions: (options: string[]) => void;
  setProgressPercent: (percent: number | null) => void;
  setQuestion: (question: string | null) => void;
  setRiskReport: (report: RiskReportPayload | null) => void;
  setStatus: (status: string) => void;
  setAiIdResponseLog: (update: (prev: AiIdResponseLogEntry[]) => AiIdResponseLogEntry[]) => void;
};

export type RunningAssessmentAnswerResult = {
  needsRiskKickoff: boolean;
  completed: boolean;
  stillAwaiting?: boolean;
};

export function completeRunningAssessment(
  assessmentId: string,
  result: AssessmentRiskResult,
  setters: Pick<RunningFlowSetters, 'setAiStage' | 'setIsAwaitingQuestion' | 'setIsComplete' | 'setOptions' | 'setProgressPercent' | 'setQuestion' | 'setRiskReport' | 'setStatus'>,
) {
  const report: RiskReportPayload = {
    assessmentId,
    completedAt: new Date().toISOString(),
    response: result.data,
    raw: result.raw,
  };
  sessionStorage.setItem(getRiskReportStorageKey(assessmentId), JSON.stringify(report));
  setters.setRiskReport(report);
  setters.setQuestion(null);
  setters.setOptions([]);
  setters.setAiStage(null);
  setters.setProgressPercent(progressPercentFromResponse(result.data) ?? 100);
  setters.setStatus(ASSESSMENT_REPORT_COMPLETE_STATUS);
  setters.setIsAwaitingQuestion(false);
  setters.setIsComplete(true);
}

function handleReadyResponse(
  data: ReturnType<typeof assertAiResult>,
  result: AssessmentRiskResult,
  hasStartedRiskPhaseRef: MutableRefObject<boolean>,
  setters: RunningFlowSetters,
  questionIdRef: MutableRefObject<string | null>,
): RunningAssessmentAnswerResult {
  if (!hasStartedRiskPhaseRef.current) {
    applyAiResponse(data, setters, questionIdRef);
    if (isIdentifiedStage(data.assessment_stage)) {
      return { needsRiskKickoff: true, completed: false };
    }
    return { needsRiskKickoff: false, completed: false };
  }

  setters.setIsAwaitingQuestion(false);
  setters.setProgressPercent(progressPercentFromResponse(result.data));
  setters.setQuestion(getRiskPrompt(result.data, result.raw));
  setters.setOptions(resolveOptions(result.data));
  setters.setAiStage(result.data?.assessment_stage ?? null);
  setters.setStatus('');
  return { needsRiskKickoff: false, completed: false };
}

export function processAssessmentAnswerResult(
  result: AssessmentRiskResult,
  hasStartedRiskPhaseRef: MutableRefObject<boolean>,
  setters: RunningFlowSetters,
  questionIdRef: MutableRefObject<string | null>,
  trimmedAssessmentId: string,
): RunningAssessmentAnswerResult {
  if (isRiskComplete(result.data, result.raw)) {
    completeRunningAssessment(trimmedAssessmentId, result, setters);
    return { needsRiskKickoff: false, completed: true };
  }

  const data = assertAiResult(result);
  questionIdRef.current = resolveQuestionId(data);

  if (questionIdRef.current === null) {
    if (!hasStartedRiskPhaseRef.current) {
      applyAiResponse(data, setters, questionIdRef);
    } else {
      setters.setIsAwaitingQuestion(true);
      setters.setQuestion(null);
      setters.setOptions([]);
      setters.setProgressPercent(progressPercentFromResponse(result.data));
      setters.setStatus(ASSESSMENT_BEING_PREPARED_STATUS);
    }
    return { needsRiskKickoff: false, completed: false, stillAwaiting: true };
  }

  return handleReadyResponse(data, result, hasStartedRiskPhaseRef, setters, questionIdRef);
}
