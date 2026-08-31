type DomainKey = 'ai' | 'medical-device';

export type ReferenceKind = 'website' | 'document';

export interface DomainReference {
  id: string;
  kind: ReferenceKind;
  value: string;
  createdAt: string;
}

function storageKey(domain: DomainKey): string {
  return `aira.domainReferences.${domain}`;
}

export function readDomainReferences(domain: DomainKey): DomainReference[] {
  try {
    const raw = localStorage.getItem(storageKey(domain));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is DomainReference => {
      if (!item || typeof item !== 'object') return false;
      const r = item as Partial<DomainReference>;
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

export function writeDomainReferences(domain: DomainKey, refs: DomainReference[]) {
  localStorage.setItem(storageKey(domain), JSON.stringify(refs));
}

export function newDomainReferenceId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

