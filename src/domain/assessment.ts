import type { RiskSeverity, WorkflowStatus } from '../constants/riskStatus';

/** Document-shaped summary row for list views (Firestore-friendly IDs, flat fields). */
export interface AssessmentSummary {
  id: string;
  title: string;
  ownerName: string;
  updatedAt: string;
  severity: RiskSeverity;
  workflowStatus: WorkflowStatus;
}
