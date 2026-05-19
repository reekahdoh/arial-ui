import { Button, Typography } from '@mui/material';
import { useMemo, type ReactNode } from 'react';
import { Link as RouterLink, useParams, useSearchParams } from 'react-router-dom';
import { AppCard } from '../../../components/ui/AppCard';
import { PageHeader } from '../../../components/ui/PageHeader';
import { isFirebaseConfigured } from '../../../services/firebase';
import { DomainReferencesListCard } from '../DomainReferencesListCard';
import { DomainReferencesPageLayout } from '../DomainReferencesPageLayout';
import { isDomainKey } from '../domainReferenceFormShared';
import { assessmentBackTo } from '../domainPageShared';
import { useAuthorativeDomainReferencesList } from '../useAuthorativeDomainReferencesList';

function UnknownDomainPage({ backTo }: { backTo: string }) {
  return (
    <>
      <PageHeader
        title="Authoritative Domain"
        description="Unknown domain. Please select a valid domain."
        actions={
          <Button component={RouterLink} to={backTo} variant="outlined" size="small">
            Back
          </Button>
        }
      />
      <AppCard>
        <Typography variant="body2" color="text.secondary">
          Choose a domain from the New Risk Assessment page.
        </Typography>
      </AppCard>
    </>
  );
}

function authorativeDomainDescription(): ReactNode {
  if (isFirebaseConfigured()) {
    return (
      <>
        A domain represents the area of activity and assets where related risks are grouped and evaluated together.
        <br />
        <br />
        Here you can view and edit the key authoritative references that will shape your domain.
        <br />
        <br />
        A well crafted domain is essential to define your risk governance approach for systems you are building
        yourself, or procuring.
      </>
    );
  }
  return 'Maintain reference sources for this domain. Stored locally until persistence is connected.';
}

export function DomainPage() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const domain = useMemo(() => (isDomainKey(params.domainKey) ? params.domainKey : null), [params.domainKey]);
  const assessmentId = searchParams.get('assessmentId') ?? '';
  const backTo = assessmentBackTo(assessmentId);
  const { refs, loading, loadError, domainId } = useAuthorativeDomainReferencesList(domain);

  if (!domain) {
    return <UnknownDomainPage backTo={backTo} />;
  }

  const addTo = assessmentId
    ? `/domains/${domain}/references/new?assessmentId=${encodeURIComponent(assessmentId)}`
    : `/domains/${domain}/references/new`;

  return (
    <DomainReferencesPageLayout
      title="Authoritative Domain"
      description={authorativeDomainDescription()}
      backTo={backTo}
      addLabel="Add Authoritative Reference"
      addTo={addTo}
      addState={{ domainId }}
    >
      <DomainReferencesListCard
        sectionTitle="Authoritative References"
        tableAriaLabel="Authorative References"
        emptyMessage="No references yet. Add a website URL or a document name."
        loading={loading}
        loadError={loadError}
        refs={refs}
      />
    </DomainReferencesPageLayout>
  );
}
