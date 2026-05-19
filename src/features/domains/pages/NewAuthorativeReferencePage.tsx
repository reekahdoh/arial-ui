import { Button, Typography } from '@mui/material';
import { useMemo } from 'react';
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AppCard } from '../../../components/ui/AppCard';
import { PageHeader } from '../../../components/ui/PageHeader';
import { isFirebaseConfigured } from '../../../services/firebase';
import {
  addAuthorativeReference,
  type AuthorativeReferenceKind,
} from '../../../services/authorativeReferences/firestoreAuthorativeReferences';
import { DomainReferenceForm } from '../DomainReferenceForm';
import { isDomainKey } from '../domainReferenceFormShared';
import {
  newDomainReferenceId,
  readDomainReferences,
  writeDomainReferences,
} from '../domainReferencesStorage';
import { NewDomainReferencePageLayout } from '../NewDomainReferencePageLayout';
import { useAuthorativeReferenceDomain } from '../useAuthorativeReferenceDomain';
import { useDomainReferenceForm } from '../useDomainReferenceForm';

function UnknownAuthorativeReferencePage({ backTo }: { backTo: string }) {
  return (
    <>
      <PageHeader
        title="New Authoritative Reference"
        description="Unknown domain. Please navigate from a specific domain page."
        actions={
          <Button component={RouterLink} to={backTo} variant="outlined" size="small">
            Back
          </Button>
        }
      />
      <AppCard>
        <Typography variant="body2" color="text.secondary">
          Choose a domain first, then add a reference.
        </Typography>
      </AppCard>
    </>
  );
}

export function NewAuthorativeReferencePage() {
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const domain = useMemo(() => (isDomainKey(params.domainKey) ? params.domainKey : null), [params.domainKey]);
  const assessmentId = searchParams.get('assessmentId') ?? '';
  const riskAssessmentBackTo = assessmentId
    ? `/assessments/new?assessmentId=${encodeURIComponent(assessmentId)}`
    : '/assessments/new';
  const backTo = domain
    ? assessmentId
      ? `/domains/${domain}?assessmentId=${encodeURIComponent(assessmentId)}`
      : `/domains/${domain}`
    : riskAssessmentBackTo;

  const { domainId, domainError, setDomainError } = useAuthorativeReferenceDomain(domain);
  const form = useDomainReferenceForm(!!domain);
  const displayError = form.error ?? domainError;

  const save = async () => {
    if (!domain || !form.canSave) return;
    form.setError(null);
    setDomainError(null);
    form.setSaving(true);

    try {
      if (!isFirebaseConfigured() || !domainId) {
        const existing = readDomainReferences(domain);
        const next = [
          { id: newDomainReferenceId(), kind: form.kind, value: form.referenceValue, createdAt: new Date().toISOString() },
          ...existing,
        ];
        writeDomainReferences(domain, next);
        navigate(backTo, { replace: true });
        return;
      }

      await addAuthorativeReference({
        domainId,
        kind: form.kind as AuthorativeReferenceKind,
        value: form.referenceValue,
      });
      navigate(backTo, { replace: true });
    } catch (err) {
      form.setError(err instanceof Error ? err.message : 'Failed to save reference');
    } finally {
      form.setSaving(false);
    }
  };

  if (!domain) {
    return <UnknownAuthorativeReferencePage backTo={riskAssessmentBackTo} />;
  }

  return (
    <NewDomainReferencePageLayout
      title="New Authoritative Reference"
      description={
        <>
          Here you can add an Authoritative Reference, either from a website or a local document.
          <br />
          <br />
          These Authoritative References will help define your domain, so be sure to include any mandatory
          regulations and compliance documentation.
        </>
      }
      backTo={backTo}
      canSave={form.canSave}
      saving={form.saving}
      error={displayError}
      onSave={() => void save()}
    >
      <DomainReferenceForm
        kind={form.kind}
        setKind={form.setKind}
        url={form.url}
        setUrl={form.setUrl}
        file={form.file}
        setFile={form.setFile}
        saving={form.saving}
      />
    </NewDomainReferencePageLayout>
  );
}
