import { buildBackendProxyUrl } from '../../../services/backendProxy';
import { progressPercentFromFields, stringFromUnknown } from './assessmentPageShared';

export { stringFromUnknown };

export type AssessmentRiskJson = {
  chat_id?: string;
  message?: string;
  history?: { role: string; content: string }[];
  chat_stage?: string;
  turn_type?: string;
  complete?: boolean;
  progress?: unknown;
  progress_percentage?: unknown;
  percentage?: unknown;
};

export type AssessmentRiskResult = {
  ok: boolean;
  status: number;
  data: AssessmentRiskJson | null;
  raw: string;
};

export type RiskReportPayload = {
  assessmentId: string;
  completedAt: string;
  response: AssessmentRiskJson | null;
  raw: string;
};

export type AssessmentRiskRequestLog = {
  method: string;
  url: string;
  assessmentId: string;
  userId: string;
  message: string;
  bodySummary: string;
};

export type AssessmentRiskResponseLog = {
  ok: boolean;
  httpStatus: number;
  raw: string;
  json: string | null;
};

export type AssessmentRiskExchangeLogEntry = {
  key: string;
  request: AssessmentRiskRequestLog;
  response: AssessmentRiskResponseLog | null;
  error: string | null;
};

export function progressPercentFromResponse(data: AssessmentRiskJson | null): number | null {
  if (!data) return null;
  return progressPercentFromFields(data, (parsed) => (parsed - 50) * 2);
}

export function buildAssessmentRiskRequestUrl(assessmentId: string, userId: string, message: string) {
  const params = new URLSearchParams();
  params.set('user_id', userId);
  params.set('message', message);
  return `${buildBackendProxyUrl(`/assessments/${encodeURIComponent(assessmentId)}/risk`)}?${params.toString()}`;
}

export function buildAssessmentRiskRequestBody(userId: string, message: string) {
  return {
    user_id: userId,
    message,
  };
}

export async function postAssessmentRisk(
  url: string,
  signal: AbortSignal,
  body: { user_id: string; message: string },
): Promise<AssessmentRiskResult> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal,
  });

  const raw = (await res.text()).trim();
  if (!raw) return { ok: res.ok, status: res.status, data: null, raw };

  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return { ok: res.ok, status: res.status, data: parsed as AssessmentRiskJson, raw };
    }
    return { ok: res.ok, status: res.status, data: null, raw };
  } catch {
    return { ok: res.ok, status: res.status, data: null, raw };
  }
}

export async function postAssessmentRiskWithBetterNetworkError(
  url: string,
  signal: AbortSignal,
  body: { user_id: string; message: string },
) {
  try {
    return await postAssessmentRisk(url, signal, body);
  } catch (err) {
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      throw new Error(
        `Failed to fetch "${url}" (network/CORS). In dev, ensure the proxy is running and restart npm start after proxy changes.`,
      );
    }
    throw err;
  }
}

function normalizeResponseMessage(message: string | null | undefined): string {
  return typeof message === 'string' ? message.trim().toUpperCase() : '';
}

export function isRiskComplete(data: AssessmentRiskJson | null, raw: string): boolean {
  if (normalizeResponseMessage(data?.message) === 'COMPLETED') return true;
  if (data?.complete === true) return true;

  const text = raw.trim().replace(/^"|"$/g, '').toUpperCase();
  return text === 'COMPLETED';
}

export function getRiskPrompt(data: AssessmentRiskJson | null, raw: string): string | null {
  if (isRiskComplete(data, raw)) return null;

  const message = data?.message;
  if (typeof message === 'string' && message.trim() !== '') return message.trim();

  const text = raw.trim().replace(/^"|"$/g, '');
  return text ? text : null;
}

export function getRiskReportStorageKey(assessmentId: string): string {
  return `risk-report:${assessmentId}`;
}
