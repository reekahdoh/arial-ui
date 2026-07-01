import { ASSESSMENT_BEING_PREPARED_STATUS, progressPercentFromFields } from './assessmentPageShared';
import {
  buildAssessmentAnswerRequestBody,
  buildAssessmentAnswerRequestUrl,
  postAssessmentAnswerJson,
  resolveChatId,
  resolveQuestionId,
  type AssessmentAnswerJson,
  type AssessmentAnswerRequestOptions,
  type AssessmentAnswerResult,
} from './assessmentAnswerApi';

export { resolveChatId };

export const IDENTIFYING_STAGE = 'identifying-ais';
export const IDENTIFIED_STAGE = 'identified-ais';

export type AssessmentAiJson = AssessmentAnswerJson & {
  chat_id: string;
  message: string;
  history: { role: string; content: string }[];
  chat_stage: string;
  turn_type: string;
};

export type AssessmentAiResult = AssessmentAnswerResult;

export type AiIdResponseLogEntry = {
  key: string;
  chatStage: string;
  httpStatus: number;
  requestUrl: string;
  requestBodyJson: string;
  responseJson: string;
};

export function normalizeChatStage(stage: string | null | undefined): string {
  return typeof stage === 'string' ? stage.trim().toLowerCase() : '';
}

export function isIdentifiedStage(stage: string | null | undefined): boolean {
  return normalizeChatStage(stage) === IDENTIFIED_STAGE;
}

export function progressPercentFromAiResponse(data: AssessmentAiJson): number | null {
  return progressPercentFromFields(data, (parsed) => parsed * 100);
}

export function buildAssessmentAiRequestUrl(
  assessmentId: string,
  userId: string,
  message?: string,
  questionId?: string | null,
) {
  return buildAssessmentAnswerRequestUrl(assessmentId, { userId, message, questionId });
}

export function buildAssessmentAiRequestBody(userId: string, message?: string, questionId?: string | null) {
  return buildAssessmentAnswerRequestBody({ userId, message, questionId });
}

export async function postAssessmentAiJson(
  url: string,
  signal: AbortSignal,
  options: AssessmentAnswerRequestOptions,
): Promise<AssessmentAiResult> {
  return postAssessmentAnswerJson(url, signal, options);
}

export function statusAfterAiResponse(chatStage: string): string {
  if (isIdentifiedStage(chatStage)) return '';
  if (normalizeChatStage(chatStage) === IDENTIFYING_STAGE) return '';
  return `Stage: ${chatStage}`;
}

export function appendAiLogEntry(
  prev: AiIdResponseLogEntry[],
  entry: Omit<AiIdResponseLogEntry, 'key'>,
): AiIdResponseLogEntry[] {
  return [...prev, { ...entry, key: `${Date.now()}-${prev.length}` }];
}

export function logAiResponse(
  setAiIdResponseLog: (update: (prev: AiIdResponseLogEntry[]) => AiIdResponseLogEntry[]) => void,
  data: AssessmentAiJson,
  httpStatus: number,
  requestUrl: string,
  requestBodyJson: string,
) {
  console.log('[assessment-answer] response', {
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

export function applyAiResponse(
  data: AssessmentAiJson,
  setters: {
    setAiStage: (stage: string) => void;
    setQuestion: (question: string | null) => void;
    setProgressPercent: (percent: number | null) => void;
    setStatus: (status: string) => void;
    setIsAwaitingQuestion: (awaiting: boolean) => void;
  },
  questionIdRef: { current: string | null },
) {
  setters.setAiStage(data.chat_stage);
  setters.setProgressPercent(progressPercentFromAiResponse(data));
  const questionId = resolveQuestionId(data);
  questionIdRef.current = questionId;
  if (questionId === null) {
    setters.setIsAwaitingQuestion(true);
    setters.setQuestion(null);
    setters.setStatus(ASSESSMENT_BEING_PREPARED_STATUS);
    return;
  }
  setters.setIsAwaitingQuestion(false);
  setters.setQuestion(data.message || null);
  setters.setStatus(statusAfterAiResponse(data.chat_stage));
}

export function assertAiResult(result: AssessmentAiResult): AssessmentAiJson {
  if (!result.ok) throw new Error(`assessment answer returned ${result.status}: ${result.raw || '(empty response)'}`);
  if (!result.data) throw new Error(`assessment answer returned non-JSON: ${result.raw || '(empty response)'}`);
  return result.data as AssessmentAiJson;
}
