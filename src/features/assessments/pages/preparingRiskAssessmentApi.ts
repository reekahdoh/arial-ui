import { buildBackendProxyUrl } from '../../../services/backendProxy';
import { progressPercentFromFields } from './assessmentPageShared';

export const IDENTIFYING_STAGE = 'identifying-ais';
export const IDENTIFIED_STAGE = 'identified-ais';
export const REQUIREMENTS_POLL_DELAY_MS = 3000;

export type AssessmentAiJson = {
  chat_id: string;
  message: string;
  history: { role: string; content: string }[];
  chat_stage: string;
  turn_type: string;
  progress?: unknown;
  progress_percentage?: unknown;
  percentage?: unknown;
};

export type AssessmentAiResult = {
  ok: boolean;
  status: number;
  data: AssessmentAiJson | null;
  raw: string;
};

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

export function isRequirementsProcessingResponse(status: number, raw: string): boolean {
  return status === 417 && raw.toLowerCase().includes('requirements still being processed');
}

export function progressPercentFromAiResponse(data: AssessmentAiJson): number | null {
  return progressPercentFromFields(data, (parsed) => parsed * 2);
}

export function buildAssessmentAiRequestUrl(assessmentId: string, userId: string, message?: string) {
  const params = new URLSearchParams();
  params.set('user_id', userId);
  params.set('message', message ?? '');
  return `${buildBackendProxyUrl(`/assessments/${encodeURIComponent(assessmentId)}/ai`)}?${params.toString()}`;
}

export function buildAssessmentAiRequestBody(userId: string, message?: string) {
  return {
    user_id: userId,
    message: message ?? '',
  };
}

export async function postAssessmentAiJson(
  url: string,
  signal: AbortSignal,
  options: { userId: string; message?: string },
): Promise<AssessmentAiResult> {
  const { userId, message } = options;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildAssessmentAiRequestBody(userId, message)),
    signal,
  });

  const raw = (await res.text()).trim();
  if (!raw) return { ok: res.ok, status: res.status, data: null, raw };

  try {
    return { ok: res.ok, status: res.status, data: JSON.parse(raw) as AssessmentAiJson, raw };
  } catch {
    return { ok: res.ok, status: res.status, data: null, raw };
  }
}

export function resolveChatId(data: AssessmentAiJson): string | null {
  return typeof data.chat_id === 'string' && data.chat_id.trim() !== '' ? data.chat_id.trim() : null;
}

export function statusAfterAiResponse(chatStage: string): string {
  if (isIdentifiedStage(chatStage)) return '';
  if (normalizeChatStage(chatStage) === IDENTIFYING_STAGE) return '';
  return `Stage: ${chatStage}`;
}
