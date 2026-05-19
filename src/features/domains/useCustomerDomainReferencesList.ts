import { useEffect, useState } from 'react';
import { listCustomerDomainReferencesByAssessment } from '../../services/domains/firestoreCustomerDomainReferences';
import type { DomainReferenceRow } from './domainPageShared';

export function useCustomerDomainReferencesList(assessmentId: string) {
  const [refs, setRefs] = useState<DomainReferenceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setLoadError(null);
    setLoading(true);
    let cancelled = false;

    void (async () => {
      try {
        if (!assessmentId.trim()) {
          setRefs([]);
          return;
        }
        const list = await listCustomerDomainReferencesByAssessment(assessmentId);
        if (cancelled) return;
        setRefs(
          list.map((ref) => ({
            id: ref.id,
            kind: ref.kind,
            value: ref.value,
            createdAt: ref.createdAt ?? '',
          })),
        );
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Failed to load customer references');
          setRefs([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [assessmentId]);

  return { refs, loading, loadError };
}
