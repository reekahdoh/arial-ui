import { stringFromUnknown } from './assessmentPageShared';
import {
  getHighestPriorityRisks,
  getOverallRiskAssessments,
  getScopeAssessmentsByLikelihood,
} from './riskReportDerivations';
import {
  requirementContradictionsFromReportDocument,
  requirementGapsFromReportDocument,
  requirementSummaryFromReportDocument,
} from './riskReportParsing';
import type { ReportDocument, RiskReportViewModel } from './riskReportTypes';

export function buildRiskReportViewModel(
  reportDocument: ReportDocument | null,
  completedAt: string | null,
): RiskReportViewModel | null {
  if (!reportDocument) return null;

  return {
    reportName: stringFromUnknown(reportDocument.name) ?? 'this assessment',
    reportDescription: stringFromUnknown(reportDocument.description) ?? 'No description provided',
    requirementSummary:
      requirementSummaryFromReportDocument(reportDocument) ?? 'the requirements in this assessment',
    requirementContradictions: requirementContradictionsFromReportDocument(reportDocument),
    requirementGaps: requirementGapsFromReportDocument(reportDocument),
    overallRiskAssessments: getOverallRiskAssessments(reportDocument),
    highestPriorityRisks: getHighestPriorityRisks(reportDocument),
    lowerPriorityRisks: getScopeAssessmentsByLikelihood(reportDocument, 'LOW'),
    completedAt,
  };
}
