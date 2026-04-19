import type { Theme } from '@mui/material/styles';

/** Overall risk signal for an assessment (maps to palette.status.*). */
export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';

/** Lifecycle / workflow state (maps to palette.workflow.*). */
export type WorkflowStatus = 'draft' | 'in_review' | 'approved' | 'archived';

export const riskSeverityLabels: Record<RiskSeverity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const workflowStatusLabels: Record<WorkflowStatus, string> = {
  draft: 'Draft',
  in_review: 'In review',
  approved: 'Approved',
  archived: 'Archived',
};

export function riskSeverityColor(theme: Theme, severity: RiskSeverity): string {
  return theme.palette.status[severity];
}

export function workflowStatusColor(theme: Theme, status: WorkflowStatus): string {
  return theme.palette.workflow[status];
}
