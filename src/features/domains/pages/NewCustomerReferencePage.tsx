import { useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { DomainReferenceForm } from '../DomainReferenceForm';
import { isDomainKey } from '../domainReferenceFormShared';
import { NewDomainReferencePageLayout } from '../NewDomainReferencePageLayout';
import { useDomainReferenceForm } from '../useDomainReferenceForm';
import {
  addCustomerDomainReference,
  type CustomerDomainReferenceKind,
} from '../../../services/domains/firestoreCustomerDomainReferences';

export function NewCustomerReferencePage() {
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const domain = useMemo(() => (isDomainKey(params.domainKey) ? params.domainKey : null), [params.domainKey]);
  const assessmentId = searchParams.get('assessmentId') ?? '';
  const backTo = assessmentId
    ? `/customer-domain?assessmentId=${encodeURIComponent(assessmentId)}`
    : domain
      ? `/customer-domains/${domain}`
      : '/customer-domain';

  const form = useDomainReferenceForm(!!assessmentId.trim());

  const save = async () => {
    if (!form.canSave) return;
    form.setError(null);
    form.setSaving(true);
    try {
      await addCustomerDomainReference({
        assessmentId,
        kind: form.kind as CustomerDomainReferenceKind,
        value: form.referenceValue,
      });
      navigate(backTo, { replace: true });
    } catch (err) {
      form.setError(err instanceof Error ? err.message : 'Failed to save customer reference');
    } finally {
      form.setSaving(false);
    }
  };

  return (
    <NewDomainReferencePageLayout
      title="New Customer Reference"
      description={
        <>
          Here you can add a Customer Reference, either from a website or a local document.
          <br />
          <br />
          These Customer References will help define your customer domain, so be sure to include any relevant
          customer documentation, policies, or source material.
        </>
      }
      backTo={backTo}
      canSave={form.canSave}
      saving={form.saving}
      error={form.error}
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
