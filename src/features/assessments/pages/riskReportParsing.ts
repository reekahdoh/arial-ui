import { stringFromUnknown } from './assessmentPageShared';
import { parseXmlReport } from './riskReportXmlParser';
import type { ReportDocument, RiskReportPayload } from './riskReportTypes';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function parseRawReport(raw: string): ReportDocument | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return parseXmlReport(raw);
  }
}

function looksLikeReportDocument(value: unknown): value is ReportDocument {
  return (
    isRecord(value) &&
    ('risk_assessment' in value ||
      'scope' in value ||
      'name' in value ||
      'requirement_summary' in value ||
      'requirementSummary' in value)
  );
}

export function completedAtFromAssessmentPayload(data: unknown): string | null {
  if (!isRecord(data)) return null;
  return (
    stringFromUnknown(data.completed_at) ??
    stringFromUnknown(data.completedAt) ??
    stringFromUnknown(data.updated_at) ??
    stringFromUnknown(data.updatedAt)
  );
}

function requirementSummaryPayloadFromReportDocument(reportDocument: ReportDocument | null): unknown {
  if (!reportDocument) return null;
  return reportDocument.requirement_summary ?? reportDocument.requirementSummary;
}

export function requirementSummaryFromReportDocument(reportDocument: ReportDocument | null): string | null {
  const requirementSummary = requirementSummaryPayloadFromReportDocument(reportDocument);
  const summaryText = stringFromUnknown(requirementSummary);
  if (summaryText) return summaryText;

  if (!isRecord(requirementSummary)) return null;
  return stringFromUnknown(requirementSummary.summary);
}

function stringsFromRequirementSummaryField(requirementSummary: Record<string, unknown>, field: string): string[] {
  const value = requirementSummary[field];
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      const text = stringFromUnknown(item);
      return text ? [text] : [];
    });
  }
  const text = stringFromUnknown(value);
  return text ? [text] : [];
}

export function requirementContradictionsFromReportDocument(reportDocument: ReportDocument | null): string[] {
  const requirementSummary = requirementSummaryPayloadFromReportDocument(reportDocument);
  if (!isRecord(requirementSummary)) return [];
  return stringsFromRequirementSummaryField(requirementSummary, 'contradictions_or_tensions');
}

export function requirementGapsFromReportDocument(reportDocument: ReportDocument | null): string[] {
  const requirementSummary = requirementSummaryPayloadFromReportDocument(reportDocument);
  if (!isRecord(requirementSummary)) return [];
  return stringsFromRequirementSummaryField(requirementSummary, 'missing_information');
}

export function reportDocumentFromAssessmentPayload(data: unknown, raw: string): ReportDocument | null {
  const fromRaw = parseRawReport(raw);
  if (fromRaw && looksLikeReportDocument(fromRaw)) return fromRaw;

  if (isRecord(data)) {
    const nestedKeys = ['report', 'risk_report', 'riskReport', 'result', 'payload', 'body'];
    for (const key of nestedKeys) {
      const nested = data[key];
      if (typeof nested === 'string') {
        const doc = parseRawReport(nested);
        if (doc && looksLikeReportDocument(doc)) return doc;
      }
      if (looksLikeReportDocument(nested)) return nested as ReportDocument;
    }
    if (looksLikeReportDocument(data)) return data as ReportDocument;
  }

  return fromRaw && isRecord(fromRaw) ? fromRaw : null;
}

export function getReportDocument(report: RiskReportPayload): ReportDocument | null {
  if (
    isRecord(report.response) &&
    ('name' in report.response ||
      'risk_assessment' in report.response ||
      'requirement_summary' in report.response ||
      'requirementSummary' in report.response)
  ) {
    return report.response;
  }
  return parseRawReport(report.raw);
}
