import type { RiskReportPayload } from './riskReportTypes';

function getRiskReportStorageKey(assessmentId: string): string {
  return `risk-report:${assessmentId}`;
}

function isRiskReportPayload(value: unknown): value is RiskReportPayload {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.assessmentId === 'string' &&
    typeof record.completedAt === 'string' &&
    typeof record.raw === 'string'
  );
}

export function readStoredRiskReport(assessmentId: string): RiskReportPayload | null {
  const stored = sessionStorage.getItem(getRiskReportStorageKey(assessmentId));
  if (!stored) return null;

  try {
    const parsed: unknown = JSON.parse(stored);
    return isRiskReportPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
