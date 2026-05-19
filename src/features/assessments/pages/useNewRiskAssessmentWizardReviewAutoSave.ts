import { useEffect, useRef } from 'react';
import type { DomainKey, WizardStep } from './newRiskAssessmentWizardTypes';

type ReviewAutoSaveParams = {
  step: WizardStep;
  name: string;
  owner: string;
  riskOwner: string;
  companyName: string;
  domain: DomainKey | '';
  isSaving: boolean;
  save: () => Promise<string | null>;
};

export function useNewRiskAssessmentWizardReviewAutoSave({
  step,
  name,
  owner,
  riskOwner,
  companyName,
  domain,
  isSaving,
  save,
}: ReviewAutoSaveParams) {
  const autoSaveAttemptedRef = useRef(false);
  useEffect(() => {
    if (step !== 'review') {
      autoSaveAttemptedRef.current = false;
      return;
    }
    const readyToSave =
      Boolean(name.trim() && owner.trim() && riskOwner.trim() && companyName.trim() && domain) &&
      !isSaving &&
      !autoSaveAttemptedRef.current;
    if (!readyToSave) return;

    autoSaveAttemptedRef.current = true;
    void save().then((savedId) => {
      if (!savedId) autoSaveAttemptedRef.current = false;
    });
  }, [save, companyName, domain, isSaving, name, owner, riskOwner, step]);
}
