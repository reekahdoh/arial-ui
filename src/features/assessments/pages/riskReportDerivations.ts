import { stringFromUnknown } from './assessmentPageShared';
import type { HighRiskSummary, OverallRiskAssessment, ReportDocument, RiskDetail } from './riskReportTypes';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeAssessmentLevel(value: unknown): string | null {
  const text = stringFromUnknown(value);
  return text ? text.toUpperCase() : null;
}

function getScopeName(scope: unknown, scopeKey: string): string | null {
  if (!isRecord(scope)) return null;
  const scopeEntry = scope[scopeKey];
  if (!isRecord(scopeEntry)) return null;
  return stringFromUnknown(scopeEntry.name);
}

function getRiskDetailsFromRisks(risks: unknown): RiskDetail[] {
  if (!isRecord(risks)) return [];

  return Object.entries(risks).flatMap(([key, risk]) => {
    if (!isRecord(risk)) return [];
    return [
      {
        key,
        name: stringFromUnknown(risk.name) ?? key,
        description: stringFromUnknown(risk.description),
      },
    ];
  });
}

function getRiskSummaryFromEntry(
  key: string,
  entry: Record<string, unknown>,
  scopeName: string | null,
): HighRiskSummary {
  const risk = isRecord(entry.risk) ? entry.risk : null;
  const riskName = stringFromUnknown(risk?.name) ?? key;
  const name = scopeName ? `${scopeName}: ${riskName}` : riskName;

  return {
    key,
    name,
    description: stringFromUnknown(risk?.description),
    impact: normalizeAssessmentLevel(entry.impact),
    likelihood: normalizeAssessmentLevel(entry.likelihood),
    risks: [],
  };
}

function stringsFromUnknownList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      const text = stringFromUnknown(item);
      return text ? [text] : [];
    });
  }
  const text = stringFromUnknown(value);
  return text ? [text] : [];
}

export function getOverallRiskAssessments(reportDocument: ReportDocument): OverallRiskAssessment[] {
  if (!isRecord(reportDocument.risk_assessment)) return [];

  const riskAssessments: OverallRiskAssessment[] = [];
  for (const [scopeKey, scopeRiskEntries] of Object.entries(reportDocument.risk_assessment)) {
    if (!isRecord(scopeRiskEntries)) continue;
    const scopeName = getScopeName(reportDocument.scope, scopeKey);

    for (const [riskKey, riskEntry] of Object.entries(scopeRiskEntries)) {
      if (!isRecord(riskEntry)) continue;
      const risk = isRecord(riskEntry.risk) ? riskEntry.risk : null;
      const riskName = stringFromUnknown(risk?.name) ?? riskKey;

      riskAssessments.push({
        key: `${scopeKey}:${riskKey}`,
        name: scopeName ? `${scopeName}: ${riskName}` : riskName,
        description: stringFromUnknown(risk?.description),
        impact: normalizeAssessmentLevel(riskEntry.impact),
        likelihood: normalizeAssessmentLevel(riskEntry.likelihood),
        mitigations: stringsFromUnknownList(riskEntry.mitigations),
      });
    }
  }
  return riskAssessments;
}

function getHighRiskAssessments(reportDocument: ReportDocument): HighRiskSummary[] {
  if (!isRecord(reportDocument.risk_assessment)) return [];

  const highRisks: HighRiskSummary[] = [];
  for (const [scopeKey, scopeRiskEntries] of Object.entries(reportDocument.risk_assessment)) {
    if (!isRecord(scopeRiskEntries)) continue;
    const scopeName = getScopeName(reportDocument.scope, scopeKey);

    for (const [riskKey, riskEntry] of Object.entries(scopeRiskEntries)) {
      if (!isRecord(riskEntry)) continue;
      const impact = normalizeAssessmentLevel(riskEntry.impact);
      const likelihood = normalizeAssessmentLevel(riskEntry.likelihood);
      if (impact === 'HIGH' || likelihood === 'HIGH') {
        highRisks.push(getRiskSummaryFromEntry(riskKey, riskEntry, scopeName));
      }
    }
  }
  return highRisks;
}

export function getScopeAssessmentsByLikelihood(
  reportDocument: ReportDocument,
  likelihoodLevel: string,
): HighRiskSummary[] {
  if (!isRecord(reportDocument.scope)) return [];

  return Object.entries(reportDocument.scope).flatMap(([key, value]) => {
    if (!isRecord(value) || normalizeAssessmentLevel(value.likelihood) !== likelihoodLevel) return [];

    return [
      {
        key,
        name: stringFromUnknown(value.name) ?? key,
        description: stringFromUnknown(value.description),
        impact: null,
        likelihood: likelihoodLevel,
        risks: getRiskDetailsFromRisks(value.risks),
      },
    ];
  });
}

export function getHighestPriorityRisks(reportDocument: ReportDocument): HighRiskSummary[] {
  const highRiskAssessments = getHighRiskAssessments(reportDocument);
  return highRiskAssessments.length > 0
    ? highRiskAssessments
    : getScopeAssessmentsByLikelihood(reportDocument, 'HIGH');
}
