import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { resolveAuthenticatedUsername } from '../../../services/auth/resolveAuthenticatedUsername';
import { delay, isAbortError, mapThrownError } from './assessmentPageShared';
import {
  buildAssessmentAiRequestBody,
  buildAssessmentAiRequestUrl,
  isIdentifiedStage,
  isRequirementsProcessingResponse,
  postAssessmentAiJson,
  progressPercentFromAiResponse,
  REQUIREMENTS_POLL_DELAY_MS,
  resolveChatId,
  statusAfterAiResponse,
  type AiIdResponseLogEntry,
  type AssessmentAiJson,
  type AssessmentAiResult,
} from './preparingRiskAssessmentApi';

const ANSWER_PROCESSING_STATUS =
  "Thanks. Please be patient - there's a lot to do here.\n\nWe’re reviewing your response, and your requirements within the specified domain, to identify where AI can be used to meet your needs.";

function appendAiLogEntry(
  prev: AiIdResponseLogEntry[],
  entry: Omit<AiIdResponseLogEntry, 'key'>,
): AiIdResponseLogEntry[] {
  return [...prev, { ...entry, key: `${Date.now()}-${prev.length}` }];
}

function logAiResponse(
  setAiIdResponseLog: Dispatch<SetStateAction<AiIdResponseLogEntry[]>>,
  data: AssessmentAiJson,
  httpStatus: number,
  requestUrl: string,
  requestBodyJson: string,
) {
  console.log('[assessment-ai] response', {
    requestUrl,
    httpStatus,
    chat_stage: data.chat_stage,
    body: data,
  });
  setAiIdResponseLog((prev) =>
    appendAiLogEntry(prev, {
      chatStage: data.chat_stage,
      httpStatus,
      requestUrl,
      requestBodyJson,
      responseJson: JSON.stringify(data, null, 2),
    }),
  );
}

function applyAiResponse(
  data: AssessmentAiJson,
  setAiStage: Dispatch<SetStateAction<string | null>>,
  setQuestion: Dispatch<SetStateAction<string | null>>,
  setProgressPercent: Dispatch<SetStateAction<number | null>>,
  setChatId: Dispatch<SetStateAction<string | null>>,
  setStatus: Dispatch<SetStateAction<string>>,
) {
  setAiStage(data.chat_stage);
  setQuestion(data.message || null);
  setProgressPercent(progressPercentFromAiResponse(data));
  setChatId((prev) => prev?.trim() || resolveChatId(data));
  setStatus(statusAfterAiResponse(data.chat_stage));
}

function assertAiResult(result: AssessmentAiResult): AssessmentAiJson {
  if (!result.ok) throw new Error(`assessment ai returned ${result.status}: ${result.raw || '(empty response)'}`);
  if (!result.data) throw new Error(`assessment ai returned non-JSON: ${result.raw || '(empty response)'}`);
  return result.data;
}

async function pollUntilAiReady(
  url: string,
  signal: AbortSignal,
  userId: string,
  setStatus: (status: string) => void,
): Promise<AssessmentAiResult> {
  let response = await postAssessmentAiJson(url, signal, { userId });
  while (!response.ok && isRequirementsProcessingResponse(response.status, response.raw)) {
    setStatus('Requirements are still being processed. Please wait...');
    await delay(REQUIREMENTS_POLL_DELAY_MS);
    response = await postAssessmentAiJson(url, signal, { userId });
  }
  return response;
}

type PreparingAiSetters = {
  setAiIdResponseLog: Dispatch<SetStateAction<AiIdResponseLogEntry[]>>;
  setAiStage: Dispatch<SetStateAction<string | null>>;
  setChatId: Dispatch<SetStateAction<string | null>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setIsFirstResponseReady: Dispatch<SetStateAction<boolean>>;
  setProgressPercent: Dispatch<SetStateAction<number | null>>;
  setQuestion: Dispatch<SetStateAction<string | null>>;
  setStatus: Dispatch<SetStateAction<string>>;
};

function useInitialPreparingLoad(assessmentId: string, user: ReturnType<typeof useAuth>['user'], setters: PreparingAiSetters) {
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    void (async () => {
      try {
        if (!assessmentId) throw new Error('Cannot identify AIs: missing assessment id.');
        if (!user) throw new Error('Cannot identify AIs: missing authenticated user.');

        setters.setStatus('Please wait whilst we prepare the materials...');
        const userId = await resolveAuthenticatedUsername(user);
        if (cancelled) return;

        const url = buildAssessmentAiRequestUrl(assessmentId, userId);
        const response = await pollUntilAiReady(url, controller.signal, userId, setters.setStatus);
        if (cancelled) return;

        const data = assertAiResult(response);
        logAiResponse(setters.setAiIdResponseLog, data, response.status, url, JSON.stringify(buildAssessmentAiRequestBody(userId), null, 2));
        applyAiResponse(data, setters.setAiStage, setters.setQuestion, setters.setProgressPercent, setters.setChatId, setters.setStatus);
        setters.setIsFirstResponseReady(true);
        setters.setStatus('');
      } catch (err) {
        if (cancelled || isAbortError(err)) return;
        setters.setError(mapThrownError(err, 'Failed to run risk assessment.'));
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [assessmentId, setters, user]);
}

function usePreparingAnswerSubmit({
  aiStage,
  answer,
  assessmentId,
  error,
  isSubmittingAnswer,
  user,
  setters,
}: {
  aiStage: string | null;
  answer: string;
  assessmentId: string;
  error: string | null;
  isSubmittingAnswer: boolean;
  user: ReturnType<typeof useAuth>['user'];
  setters: PreparingAiSetters & { setAnswer: Dispatch<SetStateAction<string>>; setIsSubmittingAnswer: Dispatch<SetStateAction<boolean>> };
}) {
  return useCallback(async () => {
    const trimmed = answer.trim();
    if (!trimmed || isSubmittingAnswer || error || isIdentifiedStage(aiStage)) return;
    if (!assessmentId) {
      setters.setError('Cannot send your answer: missing assessment id.');
      return;
    }
    if (!user) {
      setters.setError('Cannot send your answer: missing authenticated user.');
      return;
    }

    setters.setIsSubmittingAnswer(true);
    setters.setStatus(ANSWER_PROCESSING_STATUS);
    try {
      const controller = new AbortController();
      const userId = await resolveAuthenticatedUsername(user);
      const url = buildAssessmentAiRequestUrl(assessmentId, userId, trimmed);
      const response = await postAssessmentAiJson(url, controller.signal, { userId, message: trimmed });
      const data = assertAiResult(response);
      logAiResponse(setters.setAiIdResponseLog, data, response.status, url, JSON.stringify(buildAssessmentAiRequestBody(userId, trimmed), null, 2));
      applyAiResponse(data, setters.setAiStage, setters.setQuestion, setters.setProgressPercent, setters.setChatId, setters.setStatus);
      setters.setAnswer('');
    } catch (err) {
      const message = mapThrownError(err, 'Failed to submit answer.');
      if (message) setters.setError(message);
    } finally {
      setters.setIsSubmittingAnswer(false);
    }
  }, [aiStage, answer, assessmentId, error, isSubmittingAnswer, setters, user]);
}

export function usePreparingRiskAssessment(assessmentId: string) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState('Starting…');
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [aiStage, setAiStage] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [progressPercent, setProgressPercent] = useState<number | null>(null);
  const [isFirstResponseReady, setIsFirstResponseReady] = useState(false);
  const [aiIdResponseLog, setAiIdResponseLog] = useState<AiIdResponseLogEntry[]>([]);
  const aiSetters = useMemo(
    () => ({
      setAiIdResponseLog,
      setAiStage,
      setChatId,
      setError,
      setIsFirstResponseReady,
      setProgressPercent,
      setQuestion,
      setStatus,
    }),
    [],
  );

  useInitialPreparingLoad(assessmentId, user, aiSetters);

  const moveToAssessingRisk = useCallback(
    (chatIdForRisk: string) => {
      const trimmed = chatIdForRisk.trim();
      if (!trimmed) {
        setError('Cannot assess risk: ai-id did not return a chat_id.');
        return;
      }
      if (!assessmentId) {
        setError('Cannot assess risk: missing assessment id.');
        return;
      }
      navigate(`/assessments/assessing-risk?assessmentId=${encodeURIComponent(assessmentId)}`, {
        state: { assessmentId, chatId: trimmed },
      });
    },
    [assessmentId, navigate],
  );

  const submitAnswer = usePreparingAnswerSubmit({
    aiStage,
    answer,
    assessmentId,
    error,
    isSubmittingAnswer,
    user,
    setters: { ...aiSetters, setAnswer, setIsSubmittingAnswer },
  });

  const openAssessingRisk = useCallback(() => {
    const sessionChatId = chatId?.trim();
    if (!sessionChatId) {
      setError('Cannot assess risk: ai-id did not return a chat_id.');
      return;
    }
    moveToAssessingRisk(sessionChatId);
  }, [chatId, moveToAssessingRisk]);

  const showAnswerForm = !error && isFirstResponseReady && !isIdentifiedStage(aiStage) && !isSubmittingAnswer;
  const completionAction =
    !error && isFirstResponseReady && isIdentifiedStage(aiStage)
      ? { label: 'Move to Risk Assessment phase', onClick: openAssessingRisk }
      : null;

  return {
    aiIdResponseLog,
    answer,
    completionAction,
    error,
    isSubmittingAnswer,
    progressPercent,
    question,
    showAnswerForm,
    status,
    setAnswer,
    submitAnswer,
  };
}
