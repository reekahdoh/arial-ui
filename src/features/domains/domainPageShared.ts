import type { ReferenceKind } from './domainReferencesStorage';
import type { DomainKey } from './domainReferenceFormShared';

export type DomainReferenceRow = {
  id: string;
  kind: ReferenceKind;
  value: string;
  createdAt: string;
};

export function domainLabel(domain: DomainKey): string {
  return domain === 'ai' ? 'AI' : 'WHO';
}

export function referenceKindLabel(kind: ReferenceKind): string {
  return kind === 'website' ? 'Website' : 'Document';
}

export function assessmentBackTo(assessmentId: string): string {
  return assessmentId
    ? `/assessments/new?assessmentId=${encodeURIComponent(assessmentId)}`
    : '/assessments/new';
}
