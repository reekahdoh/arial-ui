import { useEffect, useState } from 'react';
import { isFirebaseConfigured } from '../../services/firebase';
import { getDomainByRouteKey } from '../../services/domains/firestoreDomains';
import { listAuthorativeReferencesByDomain } from '../../services/authorativeReferences/firestoreAuthorativeReferences';
import { readDomainReferences } from './domainReferencesStorage';
import type { DomainKey } from './domainReferenceFormShared';
import { domainLabel, type DomainReferenceRow } from './domainPageShared';

export function useAuthorativeDomainReferencesList(domain: DomainKey | null) {
  const [refs, setRefs] = useState<DomainReferenceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [domainId, setDomainId] = useState<string | null>(null);

  useEffect(() => {
    if (!domain) return;

    let cancelled = false;
    void (async () => {
      setLoadError(null);
      setLoading(true);
      try {
        if (isFirebaseConfigured()) {
          const record = await getDomainByRouteKey(domain);
          if (!record) {
            throw new Error(
              `Domain "${domainLabel(domain)}" not found in Firestore. Seed Domain documents with ids "ai" and "medical-device" (see npm run seed:firestore), or add a domain whose document id is "${domain}".`,
            );
          }
          const list = await listAuthorativeReferencesByDomain(record.id);
          if (cancelled) return;
          setDomainId(record.id);
          setRefs(
            list.map((ref) => ({
              id: ref.id,
              kind: ref.kind,
              value: ref.value,
              createdAt: ref.createdAt ?? '',
            })),
          );
        } else {
          setDomainId(null);
          setRefs(readDomainReferences(domain));
        }
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : 'Failed to load references');
        setDomainId(null);
        setRefs(readDomainReferences(domain));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [domain]);

  return { refs, loading, loadError, domainId };
}
