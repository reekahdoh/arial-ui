import { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import type { AssessmentRiskExchangeLogEntry, RiskReportPayload } from './assessingRiskAssessmentApi';
import type { AiIdResponseLogEntry } from './preparingRiskAssessmentApi';
import type { RunningFlowSetters } from './runningRiskAssessmentFlow';
import { useInitialRunningAssessmentLoad } from './useInitialRunningAssessmentLoad';
import { useRunningAnswerSubmit } from './useRunningAnswerSubmit';

export function useRunningRiskAssessment(assessmentId: string) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const questionIdRef = useRef<string | null>(null);
  const hasStartedRiskPhaseRef = useRef(false);
  const [status, setStatus] = useState('Starting…');
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [progressPercent, setProgressPercent] = useState<number | null>(null);
  const [isFirstResponseReady, setIsFirstResponseReady] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isAwaitingQuestion, setIsAwaitingQuestion] = useState(false);
  const [riskReport, setRiskReport] = useState<RiskReportPayload | null>(null);
  const [exchangeLog, setExchangeLog] = useState<AssessmentRiskExchangeLogEntry[]>([]);
  const [, setAiStage] = useState<string | null>(null);
  const [, setAiIdResponseLog] = useState<AiIdResponseLogEntry[]>([]);

  const flowSetters = useMemo<RunningFlowSetters>(
    () => ({
      setAiStage,
      setError,
      setExchangeLog,
      setIsAwaitingQuestion,
      setIsComplete,
      setProgressPercent,
      setQuestion,
      setRiskReport,
      setStatus,
      setAiIdResponseLog,
    }),
    [],
  );

  useInitialRunningAssessmentLoad({
    assessmentId,
    user,
    flowSetters,
    questionIdRef,
    hasStartedRiskPhaseRef,
    setError,
    setIsFirstResponseReady,
    setStatus,
  });

  const submitAnswer = useRunningAnswerSubmit({
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
  });

  const openRiskReport = useCallback(() => {
    if (!riskReport) return;
    navigate(`/assessments/risk-report?assessmentId=${encodeURIComponent(riskReport.assessmentId)}`, {
      state: { assessmentId: riskReport.assessmentId, report: riskReport },
    });
  }, [navigate, riskReport]);

  const showAnswerForm = !error && isFirstResponseReady && !isComplete && !isSubmittingAnswer && !isAwaitingQuestion;
  const completionAction = !error && isComplete
    ? { label: 'View Report', onClick: openRiskReport, disabled: !riskReport }
    : null;

  return {
    answer,
    completionAction,
    error,
    exchangeLog,
    isComplete,
    isSubmittingAnswer,
    progressPercent,
    question,
    showAnswerForm,
    status,
    setAnswer,
    submitAnswer,
  };
}
