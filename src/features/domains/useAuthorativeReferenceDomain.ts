import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { isFirebaseConfigured } from '../../services/firebase';
import { getDomainByRouteKey } from '../../services/domains/firestoreDomains';
import type { DomainKey } from './domainReferenceFormShared';

export function useAuthorativeReferenceDomain(domain: DomainKey | null) {
  const location = useLocation();
  const [domainId, setDomainId] = useState<string | null>(() => {
    const raw = (location.state as { domainId?: unknown } | null)?.domainId;
    return typeof raw === 'string' ? raw : null;
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!domain || !isFirebaseConfigured() || domainId) return;

    let cancelled = false;
    void (async () => {
      try {
        const record = await getDomainByRouteKey(domain);
        if (!record) throw new Error('Domain not found in Firestore');
        if (!cancelled) setDomainId(record.id);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to resolve domain');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [domain, domainId]);

  return { domainId, domainError: error, setDomainError: setError };
}
