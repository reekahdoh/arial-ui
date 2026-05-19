import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { isAbortError, mapThrownError } from './assessmentPageShared';
import {
  AI_ID_INITIAL_MESSAGE,
  AI_ID_USER_ID,
  assertAiIdResult,
  buildAiIdRequestUrl,
  formatRiskIdDoneStatus,
  getRiskIdUrl,
  IDENTIFIED_STAGE,
  isIdentifiedAiStage,
  postAiIdJson,
  postRiskIdTextWithNetworkError,
  statusAfterAiIdStage,
  type AiIdJson,
} from './runningRiskAssessmentApi';

const ANSWER_PROCESSING_STATUS =
  'Thanks, we’re analysing your answers against the Domain References to provide a clear Risk Result tailored for your project requirements.';

function applyAiIdResponse(
  data: AiIdJson,
  setAiStage: Dispatch<SetStateAction<string | null>>,
  setQuestion: Dispatch<SetStateAction<string | null>>,
  setStatus: Dispatch<SetStateAction<string>>,
) {
  setAiStage(data.chat_stage);
  setQuestion(data.message || null);
  setStatus(statusAfterAiIdStage(data.chat_stage));
}

function useInitialAiIdLoad(setters: {
  setAiStage: Dispatch<SetStateAction<string | null>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setHasStartedAiId: Dispatch<SetStateAction<boolean>>;
  setIsFirstResponseReady: Dispatch<SetStateAction<boolean>>;
  setQuestion: Dispatch<SetStateAction<string | null>>;
  setStatus: Dispatch<SetStateAction<string>>;
}) {
  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      try {
        setters.setStatus('Understanding your risk...');
        const url = buildAiIdRequestUrl(AI_ID_USER_ID, AI_ID_INITIAL_MESSAGE);
        const result = assertAiIdResult(await postAiIdJson(url, controller.signal));
        setters.setHasStartedAiId(true);
        applyAiIdResponse(result, setters.setAiStage, setters.setQuestion, setters.setStatus);
        if (result.chat_stage !== IDENTIFIED_STAGE) setters.setStatus('Ready.');
        setters.setIsFirstResponseReady(true);
      } catch (err) {
        if (isAbortError(err)) return;
        const message = mapThrownError(err, 'Failed to run risk assessment.');
        if (message) setters.setError(message);
      }
    })();

    return () => controller.abort();
  }, [setters]);
}

function useRiskIdWhenIdentified(
  aiStage: string | null,
  error: string | null,
  hasRunRisk: boolean,
  hasStartedAiId: boolean,
  setError: Dispatch<SetStateAction<string | null>>,
  setHasRunRisk: Dispatch<SetStateAction<boolean>>,
  setStatus: Dispatch<SetStateAction<string>>,
) {
  useEffect(() => {
    if (error || !hasStartedAiId || aiStage !== IDENTIFIED_STAGE || hasRunRisk) return;

    const controller = new AbortController();
    setHasRunRisk(true);

    void (async () => {
      try {
        setStatus('Calculating risk…');
        const { ok, status: httpStatus, text } = await postRiskIdTextWithNetworkError(getRiskIdUrl(), controller.signal);
        if (!ok) throw new Error(`risk-id returned ${httpStatus}: ${text || '(empty response)'}`);
        setStatus(formatRiskIdDoneStatus(text));
      } catch (err) {
        if (isAbortError(err)) return;
        setError(err instanceof Error ? err.message : 'Failed to run risk assessment.');
      }
    })();

    return () => controller.abort();
  }, [aiStage, error, hasRunRisk, hasStartedAiId, setError, setHasRunRisk, setStatus]);
}

function useRunningAnswerSubmit({
  aiStage,
  answer,
  error,
  isSubmittingAnswer,
  setters,
}: {
  aiStage: string | null;
  answer: string;
  error: string | null;
  isSubmittingAnswer: boolean;
  setters: {
    setAiStage: Dispatch<SetStateAction<string | null>>;
    setAnswer: Dispatch<SetStateAction<string>>;
    setError: Dispatch<SetStateAction<string | null>>;
    setIsSubmittingAnswer: Dispatch<SetStateAction<boolean>>;
    setQuestion: Dispatch<SetStateAction<string | null>>;
    setStatus: Dispatch<SetStateAction<string>>;
  };
}) {
  return useCallback(async () => {
    const trimmed = answer.trim();
    if (!trimmed || isSubmittingAnswer || error || isIdentifiedAiStage(aiStage)) return;

    setters.setIsSubmittingAnswer(true);
    setters.setStatus(ANSWER_PROCESSING_STATUS);
    try {
      const controller = new AbortController();
      const url = buildAiIdRequestUrl(AI_ID_USER_ID, trimmed);
      const data = assertAiIdResult(await postAiIdJson(url, controller.signal));
      applyAiIdResponse(data, setters.setAiStage, setters.setQuestion, setters.setStatus);
      setters.setAnswer('');
    } catch (err) {
      const message = mapThrownError(err, 'Failed to submit answer.');
      if (message) setters.setError(message);
    } finally {
      setters.setIsSubmittingAnswer(false);
    }
  }, [aiStage, answer, error, isSubmittingAnswer, setters]);
}

export function useRunningRiskAssessment() {
  const [status, setStatus] = useState('Starting…');
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [aiStage, setAiStage] = useState<string | null>(null);
  const [hasStartedAiId, setHasStartedAiId] = useState(false);
  const [hasRunRisk, setHasRunRisk] = useState(false);
  const [isFirstResponseReady, setIsFirstResponseReady] = useState(false);
  const [hasEnteredQa, setHasEnteredQa] = useState(false);

  const loadSetters = useMemo(
    () => ({ setAiStage, setError, setHasStartedAiId, setIsFirstResponseReady, setQuestion, setStatus }),
    [],
  );
  const answerSetters = useMemo(
    () => ({ setAiStage, setAnswer, setError, setIsSubmittingAnswer, setQuestion, setStatus }),
    [],
  );

  useInitialAiIdLoad(loadSetters);
  useRiskIdWhenIdentified(aiStage, error, hasRunRisk, hasStartedAiId, setError, setHasRunRisk, setStatus);
  const submitAnswer = useRunningAnswerSubmit({ aiStage, answer, error, isSubmittingAnswer, setters: answerSetters });

  const enterQa = useCallback(() => {
    setHasEnteredQa(true);
    setStatus('');
  }, []);

  const showAnswerForm = !error && hasEnteredQa && !isIdentifiedAiStage(aiStage) && !isSubmittingAnswer;
  const showNextButton = !error && isFirstResponseReady && !hasEnteredQa;

  return {
    answer,
    enterQa,
    error,
    isSubmittingAnswer,
    question,
    showAnswerForm,
    showNextButton,
    status,
    setAnswer,
    submitAnswer,
  };
}
