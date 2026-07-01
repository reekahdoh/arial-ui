import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { emptyProjectRequirements, type ProjectRequirementsFields } from '../../../domain/projectRequirements';
import { useAuth } from '../../../contexts/AuthContext';
import { useRiskAssessmentRun } from '../../../contexts/RiskAssessmentRunContext';
import { resolveAuthenticatedUsername } from '../../../services/auth/resolveAuthenticatedUsername';
import { isFirebaseConfigured } from '../../../services/firebase';
import { getRiskAssessment } from '../../../services/assessments/firestoreRiskAssessments';
import { domainKeyFromName } from './newRiskAssessmentWizardHelpers';
import { readWizardDraft } from './newRiskAssessmentWizardStorage';
import type { DomainKey, WizardDraftStorage, WizardStep } from './newRiskAssessmentWizardTypes';

export function applyWizardDraft(
  draft: WizardDraftStorage,
  setters: {
    setName: (v: string) => void;
    setOwner: (v: string) => void;
    setRiskOwner: (v: string) => void;
    setCompanyName: (v: string) => void;
    setDomain: (v: DomainKey | '') => void;
    setStep: (v: WizardStep) => void;
  },
) {
  setters.setName(draft.name ?? '');
  setters.setRiskOwner(draft.riskOwner ?? '');
  setters.setCompanyName(draft.companyName ?? '');
  setters.setDomain(draft.domain ?? '');
  setters.setStep(draft.step ?? 'name');
}

export function useWizardInitialLoad(
  setAssessmentId: (id: string) => void,
  setters: Parameters<typeof applyWizardDraft>[1] & {
    setProjectRequirements: (v: ProjectRequirementsFields) => void;
  },
) {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const id = searchParams.get('assessmentId')?.trim() ?? '';
    setAssessmentId(id);
    if (!id) return;

    const wizardDraft = readWizardDraft(id);
    if (wizardDraft) applyWizardDraft(wizardDraft, setters);

    if (!isFirebaseConfigured()) return;

    void (async () => {
      try {
        const remote = await getRiskAssessment(id);
        if (!remote) return;
        setters.setName(remote.name ?? '');
        setters.setRiskOwner(remote.riskOwner ?? '');
        setters.setCompanyName(remote.companyName);
        setters.setProjectRequirements(remote.customerContext ?? emptyProjectRequirements());
        setters.setStep('review');
        if (remote.domainName) {
          const key = domainKeyFromName(remote.domainName);
          if (key) setters.setDomain(key);
        }
        if (remote.domainKey) setters.setDomain(remote.domainKey);
      } catch {
        // keep local draft when remote load fails
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/** Owner is always the signed-in user; resolved from profile / auth metadata. */
export function useWizardOwnerFromAuth(setOwner: (owner: string) => void) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    void (async () => {
      const username = await resolveAuthenticatedUsername(user);
      if (!cancelled) setOwner(username);
    })();

    return () => {
      cancelled = true;
    };
  }, [setOwner, user]);
}

export function useRunDraftSync(
  assessmentId: string,
  fields: { name: string; owner: string; riskOwner: string; companyName: string; domain: DomainKey | ''; projectRequirements: ProjectRequirementsFields },
  persistTick: number,
) {
  const { setDraft: setRunDraft } = useRiskAssessmentRun();

  useEffect(() => {
    if (!assessmentId) {
      setRunDraft(null);
      return;
    }
    setRunDraft({
      assessmentId,
      name: fields.name,
      owner: fields.owner,
      riskOwner: fields.riskOwner,
      companyName: fields.companyName,
      domain: fields.domain,
      customerContext: fields.projectRequirements,
      customerReferenceText: fields.projectRequirements.freeformText,
    });
    return () => setRunDraft(null);
  }, [assessmentId, fields.companyName, fields.domain, fields.name, fields.owner, fields.projectRequirements, fields.riskOwner, persistTick, setRunDraft]);
}
