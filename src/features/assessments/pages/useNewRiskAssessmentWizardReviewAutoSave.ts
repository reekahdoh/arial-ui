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
  /** True when viewing an already-saved assessment; skips the entry auto-save. */
  startedFromExisting: boolean;
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
  startedFromExisting,
  save,
}: ReviewAutoSaveParams) {
  // Treat an existing assessment as already-saved so opening it doesn't trigger a write.
  const autoSaveAttemptedRef = useRef(startedFromExisting);
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

    // Stays true even when the save fails: clearing it here would let the resulting
    // re-render re-trigger this effect in an unbounded retry loop. The surfaced save
    // error is the user's cue to retry, and leaving the review step resets the guard.
    autoSaveAttemptedRef.current = true;
    void save();
  }, [save, companyName, domain, isSaving, name, owner, riskOwner, step]);
}
