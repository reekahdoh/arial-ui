export type RiskReportPayload = {
  assessmentId: string;
  completedAt: string;
  response: unknown;
  raw: string;
};

export type LocationState = {
  assessmentId?: unknown;
  report?: unknown;
};

export type ReportDocument = {
  id?: unknown;
  name?: unknown;
  description?: unknown;
  requirement_summary?: unknown;
  requirementSummary?: unknown;
  scope?: unknown;
  risk_assessment?: unknown;
};

export type RiskDetail = {
  key: string;
  name: string;
  description: string | null;
};

export type HighRiskSummary = {
  key: string;
  name: string;
  description: string | null;
  impact: string | null;
  likelihood: string | null;
  risks: RiskDetail[];
};

export type OverallRiskAssessment = {
  key: string;
  name: string;
  description: string | null;
  impact: string | null;
  likelihood: string | null;
  mitigations: string[];
};

export type ReportSource = {
  document: ReportDocument | null;
  completedAt: string | null;
  error: string | null;
  isLoading: boolean;
};

export type DetailedReportState = {
  error: string | null;
  hasReport: boolean;
  isChecking: boolean;
  isGenerating: boolean;
  success: string | null;
  viewUrl: string | null;
};

export type RiskReportViewModel = {
  reportName: string;
  reportDescription: string;
  requirementSummary: string;
  requirementContradictions: string[];
  requirementGaps: string[];
  overallRiskAssessments: OverallRiskAssessment[];
  highestPriorityRisks: HighRiskSummary[];
  lowerPriorityRisks: HighRiskSummary[];
  completedAt: string | null;
};
