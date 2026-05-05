import type { AssessmentSummary } from '../../domain/assessment';
import type { CustomerContextFields } from '../../domain/customerContext';

const STORAGE_KEY = 'aira.assessments';

export interface LocalAssessmentDraftFields {
  name?: string;
  owner: string;
  riskOwner?: string;
  companyName: string;
  domain: 'ai' | 'who';
  customerContext?: CustomerContextFields;
}

export interface LocalAssessmentRecord extends AssessmentSummary {
  draft: LocalAssessmentDraftFields;
}

function safeParse(json: string): unknown {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object';
}

function isCustomerContextFields(value: unknown): value is CustomerContextFields {
  if (!isRecord(value)) return false;
  const fn = value.fileName;
  const fm = value.fileMeta;
  return (
    (fn === null || typeof fn === 'string') &&
    (fm === null || typeof fm === 'string') &&
    typeof value.websiteUrl === 'string' &&
    typeof value.emailTitle === 'string' &&
    (value.freeformText === undefined || typeof value.freeformText === 'string')
  );
}

function isLocalAssessmentRecord(value: unknown): value is LocalAssessmentRecord {
  if (!isRecord(value)) return false;
  const v = value as Partial<LocalAssessmentRecord>;
  const draft = v.draft as Partial<LocalAssessmentDraftFields> | undefined;
  return (
    typeof v.id === 'string' &&
    typeof v.title === 'string' &&
    typeof v.ownerName === 'string' &&
    typeof v.updatedAt === 'string' &&
    (v.severity === 'low' || v.severity === 'medium' || v.severity === 'high' || v.severity === 'critical') &&
    (v.workflowStatus === 'draft' ||
      v.workflowStatus === 'in_review' ||
      v.workflowStatus === 'approved' ||
      v.workflowStatus === 'archived') &&
    !!draft &&
    (draft.name === undefined || typeof draft.name === 'string') &&
    typeof draft.owner === 'string' &&
    (draft.riskOwner === undefined || typeof draft.riskOwner === 'string') &&
    typeof draft.companyName === 'string' &&
    (draft.domain === 'ai' || draft.domain === 'who') &&
    (draft.customerContext === undefined || isCustomerContextFields(draft.customerContext))
  );
}

export function readLocalAssessments(): LocalAssessmentRecord[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const parsed = safeParse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isLocalAssessmentRecord);
}

export function getLocalAssessment(id: string): LocalAssessmentRecord | null {
  return readLocalAssessments().find((a) => a.id === id) ?? null;
}

export function upsertLocalAssessment(next: LocalAssessmentRecord): void {
  const all = readLocalAssessments();
  const idx = all.findIndex((a) => a.id === next.id);
  const merged = idx >= 0 ? [...all.slice(0, idx), next, ...all.slice(idx + 1)] : [next, ...all];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
}

export function newAssessmentId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `asm_${crypto.randomUUID()}`;
  }
  return `asm_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

