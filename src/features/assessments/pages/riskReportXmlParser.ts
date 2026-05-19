import type { ReportDocument } from './riskReportTypes';

function directChildText(element: Element, names: string[]): string | null {
  for (const name of names) {
    const child = Array.from(element.children).find(
      (candidate) => candidate.tagName.toLowerCase() === name.toLowerCase(),
    );
    const text = child?.textContent?.trim();
    if (text) return text;
  }
  return null;
}

function xmlChildrenByTagName(element: Element, names: string[]): Element[] {
  return Array.from(element.children).filter((child) =>
    names.some((name) => child.tagName.toLowerCase() === name.toLowerCase()),
  );
}

function parseXmlRisksUnderScope(scopeEntry: Element): Record<string, unknown> {
  const risks: Record<string, unknown> = {};
  const risksRoot = xmlChildrenByTagName(scopeEntry, ['risks'])[0];
  if (!risksRoot) return risks;

  for (const riskEntry of Array.from(risksRoot.children)) {
    const riskKey = riskEntry.getAttribute('key') ?? riskEntry.tagName;
    risks[riskKey] = {
      name: directChildText(riskEntry, ['name']),
      description: directChildText(riskEntry, ['description']),
    };
  }
  return risks;
}

function parseXmlScope(scopeRoot: Element): Record<string, unknown> {
  const scope: Record<string, unknown> = {};
  for (const scopeEntry of Array.from(scopeRoot.children)) {
    const key = scopeEntry.getAttribute('key') ?? scopeEntry.tagName;
    scope[key] = {
      name: directChildText(scopeEntry, ['name']),
      description: directChildText(scopeEntry, ['description']),
      likelihood: directChildText(scopeEntry, ['likelihood']),
      status: directChildText(scopeEntry, ['status']),
      risks: parseXmlRisksUnderScope(scopeEntry),
    };
  }
  return scope;
}

function parseXmlRiskAssessmentScope(scopeEntry: Element): Record<string, unknown> {
  const risks: Record<string, unknown> = {};
  for (const riskEntry of Array.from(scopeEntry.children)) {
    const riskKey = riskEntry.getAttribute('key') ?? riskEntry.tagName;
    const riskNode = xmlChildrenByTagName(riskEntry, ['risk'])[0] ?? riskEntry;
    risks[riskKey] = {
      risk: {
        name: directChildText(riskNode, ['name']),
        description: directChildText(riskNode, ['description']),
      },
      impact: directChildText(riskEntry, ['impact']),
      likelihood: directChildText(riskEntry, ['likelihood']),
      status: directChildText(riskEntry, ['status']),
    };
  }
  return risks;
}

function parseXmlRiskAssessment(riskAssessmentRoot: Element): Record<string, unknown> {
  const riskAssessment: Record<string, unknown> = {};
  for (const scopeEntry of Array.from(riskAssessmentRoot.children)) {
    const scopeKey = scopeEntry.getAttribute('key') ?? scopeEntry.tagName;
    riskAssessment[scopeKey] = parseXmlRiskAssessmentScope(scopeEntry);
  }
  return riskAssessment;
}

export function parseXmlReport(raw: string): ReportDocument | null {
  const xml = new DOMParser().parseFromString(raw, 'application/xml');
  if (xml.querySelector('parsererror')) return null;

  const root = xml.documentElement;
  const scopeRoot = xmlChildrenByTagName(root, ['scope'])[0];
  const riskAssessmentRoot = xmlChildrenByTagName(root, ['risk_assessment', 'riskAssessment'])[0];

  return {
    id: directChildText(root, ['id']),
    name: directChildText(root, ['name']),
    description: directChildText(root, ['description']),
    requirement_summary: directChildText(root, [
      'requirement_summary',
      'requirementSummary',
      'requirement-summary',
    ]),
    scope: scopeRoot ? parseXmlScope(scopeRoot) : {},
    risk_assessment: riskAssessmentRoot ? parseXmlRiskAssessment(riskAssessmentRoot) : {},
  };
}
