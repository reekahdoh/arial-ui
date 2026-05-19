import type { User } from 'firebase/auth';
import type { ProjectRequirementsFields } from '../../../domain/projectRequirements';
import { resolveAuthenticatedUsername } from '../../../services/auth/resolveAuthenticatedUsername';
import { putBackendAssessmentRequirements } from '../../../services/assessments/backendAssessments';
import { parseRequirementsFileRecords } from '../../../services/assessments/backendRequirementsDocuments';
import {
  getRiskAssessment,
  resolveBackendAssessmentId,
  type RiskAssessmentRead,
} from '../../../services/assessments/firestoreRiskAssessments';

export const GMAIL_INBOX_URL = 'https://mail.google.com/mail/u/0/#inbox';

export type ContextSectionId = 'document' | 'website' | 'email' | 'text';

export type SupportingContextRow = {
  id: ContextSectionId;
  type: string;
  details: string;
};

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function toOpenableHttpUrl(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (isValidHttpUrl(t)) return t;
  const withScheme = `https://${t}`;
  return isValidHttpUrl(withScheme) ? withScheme : null;
}

export function formatFileValue(file: File): string {
  const kb = Math.max(1, Math.round(file.size / 1024));
  const type = file.type ? file.type : 'unknown type';
  return `${file.name} (${type}, ${kb} KB)`;
}

export function supportingContextRows(saved: ProjectRequirementsFields): SupportingContextRow[] {
  const rows: SupportingContextRow[] = [];
  const docLine = (saved.fileMeta ?? saved.fileName)?.trim();
  if (docLine) rows.push({ id: 'document', type: 'Document', details: docLine });
  if (saved.websiteUrl.trim()) rows.push({ id: 'website', type: 'Website', details: saved.websiteUrl.trim() });
  if (saved.emailTitle.trim()) rows.push({ id: 'email', type: 'Email', details: saved.emailTitle.trim() });
  if (saved.freeformText.trim()) rows.push({ id: 'text', type: 'Text', details: saved.freeformText.trim() });
  return rows;
}

function firstNonEmpty(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

function assessmentUploadName(assessment: RiskAssessmentRead | null): string {
  return firstNonEmpty(assessment?.name, assessment?.title) ?? 'Risk assessment';
}

function assessmentUploadDescription(assessment: RiskAssessmentRead | null): string {
  return firstNonEmpty(assessment?.riskOwner, assessment?.companyName) ?? 'Project requirements';
}

export async function uploadRequirementsDocument(
  assessmentId: string,
  file: File,
  user: User | null,
): Promise<string | null> {
  if (!user) throw new Error('You must be signed in to upload a requirements document.');

  const [userId, assessment, backendAssessmentId] = await Promise.all([
    resolveAuthenticatedUsername(user),
    getRiskAssessment(assessmentId),
    resolveBackendAssessmentId(assessmentId),
  ]);
  const uploadResult = await putBackendAssessmentRequirements(backendAssessmentId, {
    userId,
    name: assessmentUploadName(assessment),
    description: assessmentUploadDescription(assessment),
    file,
  });

  if (!uploadResult.ok) {
    throw new Error(
      `PUT /assessments/${backendAssessmentId}/requirements returned ${uploadResult.status}: ${uploadResult.raw || '(empty response)'}`,
    );
  }

  const records = parseRequirementsFileRecords(uploadResult.data);
  return records[0]?.doc_id ?? null;
}
