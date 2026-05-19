import type { Theme } from '@mui/material/styles';

/** Overall risk signal for an assessment (maps to palette.status.*). */
export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';

/** Impact / likelihood band on the Risk Report (maps to palette.riskLevel.*). */
export type RiskLevelBand = 'low' | 'moderate' | 'high';

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

export function riskLevelBandFromLabel(level: string | null | undefined): RiskLevelBand {
  const normalized = typeof level === 'string' ? level.trim().toUpperCase() : '';
  if (normalized === 'HIGH') return 'high';
  if (normalized === 'MODERATE') return 'moderate';
  return 'low';
}

export function riskLevelBandFromSeverity(severity: RiskSeverity): RiskLevelBand {
  if (severity === 'low') return 'low';
  if (severity === 'medium') return 'moderate';
  return 'high';
}

export function riskLevelMainColor(theme: Theme, band: RiskLevelBand): string {
  return theme.palette.riskLevel[band].main;
}

export function riskLevelContrastText(theme: Theme, band: RiskLevelBand): string {
  return theme.palette.riskLevel[band].contrastText;
}

export function riskSeverityColor(theme: Theme, severity: RiskSeverity): string {
  return riskLevelMainColor(theme, riskLevelBandFromSeverity(severity));
}

export function riskSeverityContrastText(theme: Theme, severity: RiskSeverity): string {
  return riskLevelContrastText(theme, riskLevelBandFromSeverity(severity));
}

/** Table cell / chip styling for a report impact or likelihood value. */
export function riskLevelCellSx(theme: Theme, level: string | null | undefined) {
  const band = riskLevelBandFromLabel(level);
  return {
    bgcolor: riskLevelMainColor(theme, band),
    color: riskLevelContrastText(theme, band),
    fontWeight: 700,
  } as const;
}

export function workflowStatusColor(theme: Theme, status: WorkflowStatus): string {
  return theme.palette.workflow[status];
}
