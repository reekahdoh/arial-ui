import type { ProjectRequirementsFields } from '../../../domain/projectRequirements';
import type { DomainKey } from './newRiskAssessmentWizardTypes';

const ASSESSMENT_ID_KEYS = ['assessment_id', 'assessmentId', 'id'] as const;
const NESTED_OBJECT_KEYS = ['assessment', 'data', 'result'] as const;

function primitiveAssessmentId(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number') return String(value);
  return null;
}

function assessmentIdFromRecord(record: Record<string, unknown>): string | null {
  for (const key of ASSESSMENT_ID_KEYS) {
    const id = primitiveAssessmentId(record[key]);
    if (id) return id;
  }
  for (const key of NESTED_OBJECT_KEYS) {
    const nested = extractBackendAssessmentId(record[key]);
    if (nested) return nested;
  }
  return null;
}

export function extractBackendAssessmentId(value: unknown): string | null {
  const primitive = primitiveAssessmentId(value);
  if (primitive) return primitive;
  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = extractBackendAssessmentId(item);
      if (nested) return nested;
    }
    return null;
  }
  if (value && typeof value === 'object') {
    return assessmentIdFromRecord(value as Record<string, unknown>);
  }
  return null;
}

export function domainKeyFromName(name: string): DomainKey | null {
  const normalized = name.trim().toLowerCase();
  if (normalized === 'ai') return 'ai';
  if (normalized === 'who') return 'who';
  return null;
}

function requirementsDocumentDisplayName(saved: ProjectRequirementsFields): string {
  if (saved.fileName?.trim()) return saved.fileName.trim();
  if (saved.fileMeta?.trim()) return saved.fileMeta.trim();
  return '';
}

export function projectRequirementsRows(saved: ProjectRequirementsFields): Array<{ type: string; details: string }> {
  const rows: Array<{ type: string; details: string }> = [];
  const docLine = requirementsDocumentDisplayName(saved);
  if (docLine) rows.push({ type: 'Document', details: docLine });
  if (saved.websiteUrl.trim()) rows.push({ type: 'Website', details: saved.websiteUrl.trim() });
  if (saved.emailTitle.trim()) rows.push({ type: 'Email', details: saved.emailTitle.trim() });
  if (saved.freeformText.trim()) rows.push({ type: 'Text', details: saved.freeformText.trim() });
  return rows;
}

export function isWizardStepComplete(
  step: import('./newRiskAssessmentWizardTypes').WizardStep,
  fields: { name: string; owner: string; riskOwner: string; companyName: string; domain: DomainKey | '' },
): boolean {
  switch (step) {
    case 'name':
      return fields.name.trim() !== '';
    case 'owner':
      return fields.owner.trim() !== '';
    case 'riskOwner':
      return fields.riskOwner.trim() !== '';
    case 'company':
      return fields.companyName.trim() !== '';
    case 'domain':
      return Boolean(fields.domain);
    case 'customerDomain':
    case 'review':
      return Boolean(fields.domain);
  }
}
