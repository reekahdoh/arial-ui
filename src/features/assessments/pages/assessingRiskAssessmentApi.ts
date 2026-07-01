import { progressPercentFromFields, stringFromUnknown } from './assessmentPageShared';
import {
  buildAssessmentAnswerRequestBody,
  buildAssessmentAnswerRequestUrl,
  postAssessmentAnswerJson,
  postAssessmentAnswerWithBetterNetworkError,
  type AssessmentAnswerJson,
  type AssessmentAnswerRequestOptions,
  type AssessmentAnswerResult,
} from './assessmentAnswerApi';

export { stringFromUnknown };

export type AssessmentRiskJson = AssessmentAnswerJson;
export type AssessmentRiskResult = AssessmentAnswerResult;

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
  return progressPercentFromFields(data, (parsed) => parsed * 100);
}

export function buildAssessmentRiskRequestUrl(
  assessmentId: string,
  userId: string,
  message: string,
  questionId?: string | null,
) {
  return buildAssessmentAnswerRequestUrl(assessmentId, { userId, message, questionId });
}

export function buildAssessmentRiskRequestBody(userId: string, message: string, questionId?: string | null) {
  return buildAssessmentAnswerRequestBody({ userId, message, questionId });
}

export async function postAssessmentRisk(
  url: string,
  signal: AbortSignal,
  options: AssessmentAnswerRequestOptions,
): Promise<AssessmentRiskResult> {
  return postAssessmentAnswerJson(url, signal, options);
}

export async function postAssessmentRiskWithBetterNetworkError(
  url: string,
  signal: AbortSignal,
  options: AssessmentAnswerRequestOptions,
) {
  return postAssessmentAnswerWithBetterNetworkError(url, signal, options);
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
