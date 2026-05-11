export type CustomerDomainReferenceKind = 'website' | 'document';

export interface CustomerDomainReference {
  id: string;
  kind: CustomerDomainReferenceKind;
  value: string;
  createdAt: string;
}

function storageKey(scope: string): string {
  return `aira.customerDomainReferences.${scope}`;
}

export function readCustomerDomainReferences(scope: string): CustomerDomainReference[] {
  try {
    const raw = localStorage.getItem(storageKey(scope));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is CustomerDomainReference => {
      if (!item || typeof item !== 'object') return false;
      const r = item as Partial<CustomerDomainReference>;
      return (
        typeof r.id === 'string' &&
        (r.kind === 'website' || r.kind === 'document') &&
        typeof r.value === 'string' &&
        typeof r.createdAt === 'string'
      );
    });
  } catch {
    return [];
  }
}

export function writeCustomerDomainReferences(scope: string, refs: CustomerDomainReference[]) {
  localStorage.setItem(storageKey(scope), JSON.stringify(refs));
}

export function newCustomerDomainReferenceId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
