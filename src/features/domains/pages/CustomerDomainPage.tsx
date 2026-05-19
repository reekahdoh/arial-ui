import { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { DomainReferencesListCard } from '../DomainReferencesListCard';
import { DomainReferencesPageLayout } from '../DomainReferencesPageLayout';
import { isDomainKey } from '../domainReferenceFormShared';
import { assessmentBackTo } from '../domainPageShared';
import { useCustomerDomainReferencesList } from '../useCustomerDomainReferencesList';

export function CustomerDomainPage() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const domain = useMemo(() => (isDomainKey(params.domainKey) ? params.domainKey : null), [params.domainKey]);
  const assessmentId = searchParams.get('assessmentId') ?? '';
  const backTo = assessmentBackTo(assessmentId);
  const { refs, loading, loadError } = useCustomerDomainReferencesList(assessmentId);

  const addTo = assessmentId
    ? `/customer-domain/references/new?assessmentId=${encodeURIComponent(assessmentId)}`
    : domain
      ? `/customer-domains/${domain}/references/new`
      : '/customer-domain/references/new';

  return (
    <DomainReferencesPageLayout
      title="Customer Domain"
      description={
        <>
          A customer domain represents the customer-specific area of activity and assets where related risks are
          grouped and evaluated together.
          <br />
          <br />
          Here you can view and edit the key customer references that will shape your customer domain.
          <br />
          <br />
          A well crafted customer domain is essential to define your risk governance approach for systems you are
          building yourself, or procuring.
        </>
      }
      backTo={backTo}
      addLabel="Add Customer Reference"
      addTo={addTo}
    >
      <DomainReferencesListCard
        sectionTitle="Customer References"
        tableAriaLabel="Customer References"
        emptyMessage="No customer references yet. Add a website URL or a document name."
        loading={loading}
        loadError={loadError}
        refs={refs}
      />
    </DomainReferencesPageLayout>
  );
}
