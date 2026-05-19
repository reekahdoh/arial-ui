import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { isAbortError } from './assessmentPageShared';
import {
  buildAssessmentRiskRequestBody,
  buildAssessmentRiskRequestUrl,
  getRiskPrompt,
  getRiskReportStorageKey,
  isRiskComplete,
  postAssessmentRiskWithBetterNetworkError,
  progressPercentFromResponse,
  type AssessmentRiskExchangeLogEntry,
  type AssessmentRiskRequestLog,
  type AssessmentRiskResult,
  type RiskReportPayload,
} from './assessingRiskAssessmentApi';

const SUBMITTING_STATUS =
  "Please be patient while we process your response.\n\nWe're looking to fully underdstand your requirements and the risks involved in using AI to meet those requirements.\n\nThis may take a few minutes.";

function responseLog(result: AssessmentRiskResult) {
  return {
    ok: result.ok,
    httpStatus: result.status,
    raw: result.raw,
    json: result.data ? JSON.stringify(result.data, null, 2) : null,
  };
}

type RiskSenderSetters = {
  setProgressPercent: Dispatch<SetStateAction<number | null>>;
  setQuestion: Dispatch<SetStateAction<string | null>>;
  setRiskExchangeLog: Dispatch<SetStateAction<AssessmentRiskExchangeLogEntry[]>>;
  setRiskReport: Dispatch<SetStateAction<RiskReportPayload | null>>;
  setStatus: Dispatch<SetStateAction<string>>;
  setIsComplete: Dispatch<SetStateAction<boolean>>;
};

function useRiskAnswerSender(assessmentId: string, setters: RiskSenderSetters) {
  const { user } = useAuth();

  const completeRiskAssessment = useCallback((trimmedAssessmentId: string, result: AssessmentRiskResult) => {
    const report = {
      assessmentId: trimmedAssessmentId,
      completedAt: new Date().toISOString(),
      response: result.data,
      raw: result.raw,
    };
    sessionStorage.setItem(getRiskReportStorageKey(trimmedAssessmentId), JSON.stringify(report));
    setters.setRiskReport(report);
    setters.setQuestion(null);
    setters.setProgressPercent(progressPercentFromResponse(result.data) ?? 100);
    setters.setStatus('Risk assessment complete.');
    setters.setIsComplete(true);
  }, [setters]);

  return useCallback(async (message: string, signal: AbortSignal) => {
    const trimmedAssessmentId = assessmentId.trim();
    if (!trimmedAssessmentId) throw new Error('Cannot assess risk: missing assessment id.');
    if (!user) throw new Error('Cannot assess risk: missing authenticated user.');

    const userId = user.uid;
    const requestBody = buildAssessmentRiskRequestBody(userId, message);
    const url = buildAssessmentRiskRequestUrl(trimmedAssessmentId, userId, message);
    const key = `${Date.now()}-${message.length}`;
    const request: AssessmentRiskRequestLog = {
      method: 'POST',
      url,
      assessmentId: trimmedAssessmentId,
      userId,
      message,
      bodySummary: JSON.stringify(requestBody, null, 2),
    };
    setters.setRiskExchangeLog((prev) => [...prev, { key, request, response: null, error: null }]);

    let result: AssessmentRiskResult;
    try {
      result = await postAssessmentRiskWithBetterNetworkError(url, signal, requestBody);
    } catch (err) {
      setters.setRiskExchangeLog((prev) => updateFailedExchange(prev, key, err));
      throw err;
    }

    setters.setRiskExchangeLog((prev) =>
      prev.map((entry) => (entry.key === key ? { ...entry, response: responseLog(result) } : entry)),
    );
    if (!result.ok) throw new Error(`assessment risk returned ${result.status}: ${result.raw || '(empty response)'}`);

    setters.setProgressPercent(progressPercentFromResponse(result.data));
    if (isRiskComplete(result.data, result.raw)) {
      completeRiskAssessment(trimmedAssessmentId, result);
      return;
    }
    setters.setQuestion(getRiskPrompt(result.data, result.raw));
    setters.setStatus('');
  }, [assessmentId, completeRiskAssessment, setters, user]);
}

function updateFailedExchange(entries: AssessmentRiskExchangeLogEntry[], key: string, err: unknown) {
  if (isAbortError(err)) return entries.filter((entry) => entry.key !== key);
  return entries.map((entry) =>
    entry.key === key ? { ...entry, error: err instanceof Error ? err.message : 'assessment risk request failed.' } : entry,
  );
}

function useInitialRiskAssessment(sendRiskAnswer: (message: string, signal: AbortSignal) => Promise<void>) {
  const initialRiskStartedRef = useRef(false);
  const [initialError, setInitialError] = useState<string | null>(null);
  const [isFirstResponseReady, setIsFirstResponseReady] = useState(false);

  useEffect(() => {
    if (initialRiskStartedRef.current) return;
    initialRiskStartedRef.current = true;
    const controller = new AbortController();

    void (async () => {
      try {
        await sendRiskAnswer('', controller.signal);
        setIsFirstResponseReady(true);
      } catch (err) {
        if (isAbortError(err)) {
          initialRiskStartedRef.current = false;
          return;
        }
        setInitialError(err instanceof Error ? err.message : 'Failed to assess risk.');
      }
    })();

    return () => {
      initialRiskStartedRef.current = false;
      controller.abort();
    };
  }, [sendRiskAnswer]);

  return { initialError, isFirstResponseReady, setIsFirstResponseReady };
}

export function useAssessingRiskAssessment(assessmentId: string) {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Starting risk assessment...');
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [riskReport, setRiskReport] = useState<RiskReportPayload | null>(null);
  const [progressPercent, setProgressPercent] = useState<number | null>(null);
  const [riskExchangeLog, setRiskExchangeLog] = useState<AssessmentRiskExchangeLogEntry[]>([]);
  const senderSetters = useMemo(() => ({
    setProgressPercent,
    setQuestion,
    setRiskExchangeLog,
    setRiskReport,
    setStatus,
    setIsComplete,
  }), []);
  const sendRiskAnswer = useRiskAnswerSender(assessmentId, senderSetters);
  const { initialError, isFirstResponseReady, setIsFirstResponseReady } = useInitialRiskAssessment(sendRiskAnswer);

  useEffect(() => {
    setStatus('Working to understand the level of risk...');
  }, []);

  useEffect(() => {
    if (initialError) setError(initialError);
  }, [initialError]);

  const submitAnswer = useCallback(async () => {
    const trimmed = answer.trim();
    if (!trimmed || isSubmittingAnswer || error || isComplete) return;

    const controller = new AbortController();
    setIsSubmittingAnswer(true);
    setStatus(SUBMITTING_STATUS);
    try {
      await sendRiskAnswer(trimmed, controller.signal);
      setAnswer('');
      setIsFirstResponseReady(true);
    } catch (err) {
      if (!isAbortError(err)) setError(err instanceof Error ? err.message : 'Failed to submit answer.');
    } finally {
      setIsSubmittingAnswer(false);
    }
  }, [answer, error, isComplete, isSubmittingAnswer, sendRiskAnswer, setIsFirstResponseReady]);

  const openRiskReport = useCallback(() => {
    if (!riskReport) return;
    navigate(`/assessments/risk-report?assessmentId=${encodeURIComponent(riskReport.assessmentId)}`, {
      state: {
        assessmentId: riskReport.assessmentId,
        report: riskReport,
      },
    });
  }, [navigate, riskReport]);

  return {
    answer,
    error,
    isComplete,
    isFirstResponseReady,
    isSubmittingAnswer,
    openRiskReport,
    progressPercent,
    question,
    riskExchangeLog,
    riskReport,
    setAnswer,
    status,
    submitAnswer,
  };
}
