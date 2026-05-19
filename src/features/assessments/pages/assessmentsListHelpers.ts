import type { RiskAssessmentRead } from '../../../services/assessments/firestoreRiskAssessments';

export type AssessmentStatusState = {
  status: string | null;
  assessmentId: string | null;
  isLoading: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object';
}

export function getAssessmentId(row: RiskAssessmentRead): string {
  return row.backendAssessmentId?.trim() || row.id;
}

export function getAssessmentStatus(data: unknown): string | null {
  if (!isRecord(data) || typeof data.status !== 'string') return null;
  const status = data.status.trim();
  return status || null;
}

export function isCompletedAssessmentStatus(status: string | null | undefined): boolean {
  return status?.trim().toUpperCase() === 'COMPLETED';
}

export function sortAssessments(local: RiskAssessmentRead[]): RiskAssessmentRead[] {
  return [...local].sort((a, b) => (a.updatedAt > b.updatedAt ? -1 : a.updatedAt < b.updatedAt ? 1 : 0));
}

export function assessmentStatusLabel(
  assessmentId: string,
  backendStatusState: AssessmentStatusState | undefined,
): string {
  if (!assessmentId) return 'Missing assessment ID';
  if (backendStatusState?.isLoading) return 'Loading...';
  return backendStatusState?.status ?? 'Unavailable';
}
