import type { RiskAssessmentRead } from '../../../services/assessments/firestoreRiskAssessments';

export type AssessmentStatusState = {
  status: string | null;
  riskImpact: string | null;
  riskLikelihood: string | null;
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

function riskScoreFromScores(scores: unknown, key: 'risk_impact' | 'risk_likelihood'): string | null {
  if (!isRecord(scores)) return null;
  const raw = scores[key];
  if (typeof raw !== 'string') return null;
  const value = raw.trim();
  return value ? value.toUpperCase() : null;
}

function riskScoreFromAssessmentData(data: unknown, key: 'risk_impact' | 'risk_likelihood'): string | null {
  if (!isRecord(data)) return null;

  const fromTopLevel = riskScoreFromScores(data.scores, key);
  if (fromTopLevel) return fromTopLevel;

  const assessment = data.assessment;
  if (isRecord(assessment)) {
    return riskScoreFromScores(assessment.scores, key);
  }

  return null;
}

export function getAssessmentRiskImpact(data: unknown): string | null {
  return riskScoreFromAssessmentData(data, 'risk_impact');
}

export function getAssessmentRiskLikelihood(data: unknown): string | null {
  return riskScoreFromAssessmentData(data, 'risk_likelihood');
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
