import { buildBackendProxyUrl } from '../../../services/backendProxy';

export type AssessmentAnswerJson = {
  chat_id?: string;
  message?: string;
  question_id?: string;
  history?: { role: string; content: string }[];
  chat_stage?: string;
  turn_type?: string;
  complete?: boolean;
  progress?: unknown;
  progress_percentage?: unknown;
  percentage?: unknown;
};

export type AssessmentAnswerResult = {
  ok: boolean;
  status: number;
  data: AssessmentAnswerJson | null;
  raw: string;
};

export type AssessmentAnswerRequestOptions = {
  userId: string;
  message?: string;
  questionId?: string | null;
};

export function buildAssessmentAnswerRequestBody(options: AssessmentAnswerRequestOptions) {
  const { userId, message = '', questionId } = options;
  const body: Record<string, string> = {
    user_id: userId,
    message,
  };
  const trimmedQuestionId = questionId?.trim();
  if (trimmedQuestionId) {
    body.question_id = trimmedQuestionId;
  }
  return body;
}

export function buildAssessmentAnswerRequestUrl(assessmentId: string, options: AssessmentAnswerRequestOptions) {
  const { userId, message = '', questionId } = options;
  const params = new URLSearchParams();
  params.set('user_id', userId);
  params.set('message', message);
  const trimmedQuestionId = questionId?.trim();
  if (trimmedQuestionId) {
    params.set('question_id', trimmedQuestionId);
  }
  return `${buildBackendProxyUrl(`/assessments/${encodeURIComponent(assessmentId)}/answer`)}?${params.toString()}`;
}

export async function postAssessmentAnswerJson(
  url: string,
  signal: AbortSignal,
  options: AssessmentAnswerRequestOptions,
): Promise<AssessmentAnswerResult> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildAssessmentAnswerRequestBody(options)),
    signal,
  });

  const raw = (await res.text()).trim();
  if (!raw) return { ok: res.ok, status: res.status, data: null, raw };

  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return { ok: res.ok, status: res.status, data: parsed as AssessmentAnswerJson, raw };
    }
    return { ok: res.ok, status: res.status, data: null, raw };
  } catch {
    return { ok: res.ok, status: res.status, data: null, raw };
  }
}

export async function postAssessmentAnswerWithBetterNetworkError(
  url: string,
  signal: AbortSignal,
  options: AssessmentAnswerRequestOptions,
) {
  try {
    return await postAssessmentAnswerJson(url, signal, options);
  } catch (err) {
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      throw new Error(
        `Failed to fetch "${url}" (network/CORS). In dev, ensure the proxy is running and restart npm start after proxy changes.`,
      );
    }
    throw err;
  }
}

export function resolveQuestionId(data: AssessmentAnswerJson | null | undefined): string | null {
  if (typeof data?.question_id === 'string' && data.question_id.trim() !== '') {
    return data.question_id.trim();
  }
  return null;
}

export function resolveChatId(data: AssessmentAnswerJson): string | null {
  return typeof data.chat_id === 'string' && data.chat_id.trim() !== '' ? data.chat_id.trim() : null;
}
