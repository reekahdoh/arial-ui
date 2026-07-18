import { backendFetch, buildBackendProxyUrl } from '../../../services/backendProxy';
import { IDENTIFIED_STAGE, IDENTIFYING_STAGE, normalizeChatStage } from './preparingRiskAssessmentApi';

export { IDENTIFIED_STAGE, IDENTIFYING_STAGE };

export const AI_ID_USER_ID = 'me';
export const AI_ID_INITIAL_MESSAGE =
  'I am procuring an AI system for tracking vehicles in and across CCTV video.';

export type AiIdJson = {
  chat_id: string;
  message: string;
  history: { role: string; content: string }[];
  chat_stage: string;
  turn_type: string;
};

export type AiIdResult = {
  ok: boolean;
  status: number;
  data: AiIdJson | null;
  raw: string;
};

export function isIdentifiedAiStage(stage: string | null | undefined): boolean {
  return normalizeChatStage(stage) === IDENTIFIED_STAGE;
}

export function statusAfterAiIdStage(chatStage: string): string {
  if (chatStage === IDENTIFIED_STAGE) return 'AI identified.';
  if (chatStage === IDENTIFYING_STAGE) return '';
  return `Stage: ${chatStage}`;
}

export function buildAiIdRequestUrl(userId: string, message: string) {
  const params = new URLSearchParams();
  params.set('user_id', userId);
  params.set('message', message);
  return `${buildBackendProxyUrl('/ai-id')}?${params.toString()}`;
}

export async function postAiIdJson(url: string, signal: AbortSignal): Promise<AiIdResult> {
  const res = await backendFetch(url, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: '',
    signal,
  });

  const raw = (await res.text()).trim();
  if (!raw) return { ok: res.ok, status: res.status, data: null, raw };

  try {
    return { ok: res.ok, status: res.status, data: JSON.parse(raw) as AiIdJson, raw };
  } catch {
    return { ok: res.ok, status: res.status, data: null, raw };
  }
}

export function assertAiIdResult(result: AiIdResult): AiIdJson {
  if (!result.ok) throw new Error(`ai-id returned ${result.status}: ${result.raw || '(empty response)'}`);
  if (!result.data) throw new Error(`ai-id returned non-JSON: ${result.raw || '(empty response)'}`);
  return result.data;
}

export function getRiskIdUrl(): string {
  return buildBackendProxyUrl('/risk-id');
}

export async function postRiskIdText(url: string, signal: AbortSignal) {
  const res = await backendFetch(url, {
    method: 'POST',
    headers: { Accept: 'application/json, text/plain, */*' },
    signal,
  });
  const text = (await res.text()).trim();
  return { ok: res.ok, status: res.status, text };
}

export async function postRiskIdTextWithNetworkError(url: string, signal: AbortSignal) {
  try {
    return await postRiskIdText(url, signal);
  } catch (err) {
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      throw new Error(
        `Failed to fetch "${url}" (network/CORS). In dev, ensure the proxy is running and restart npm start after proxy changes.`,
      );
    }
    throw err;
  }
}

export function formatRiskIdDoneStatus(text: string): string {
  return text ? `Done: ${text.replace(/^"|"$/g, '')}` : 'Done.';
}
