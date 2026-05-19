import { useCallback, useMemo } from 'react';
import { isWizardStepComplete } from './newRiskAssessmentWizardHelpers';
import { writeWizardDraft } from './newRiskAssessmentWizardStorage';
import type { DomainKey, WizardDraftStorage, WizardStep } from './newRiskAssessmentWizardTypes';
import { WIZARD_STEP_ORDER } from './newRiskAssessmentWizardTypes';

type NavigationParams = {
  assessmentId: string;
  step: WizardStep;
  setStep: (step: WizardStep) => void;
  name: string;
  owner: string;
  riskOwner: string;
  companyName: string;
  domain: DomainKey | '';
};

export function useNewRiskAssessmentWizardNavigation({
  assessmentId,
  step,
  setStep,
  name,
  owner,
  riskOwner,
  companyName,
  domain,
}: NavigationParams) {
  const wizardDraft: WizardDraftStorage = useMemo(
    () => ({
      name: name.trim(),
      owner: owner.trim(),
      riskOwner: riskOwner.trim(),
      companyName: companyName.trim(),
      ...(domain ? { domain } : {}),
    }),
    [name, owner, riskOwner, companyName, domain],
  );

  const stepIsComplete = isWizardStepComplete(step, { name, owner, riskOwner, companyName, domain });

  const nextStep = useCallback(() => {
    if (!stepIsComplete) return;
    const next = WIZARD_STEP_ORDER[Math.min(WIZARD_STEP_ORDER.indexOf(step) + 1, WIZARD_STEP_ORDER.length - 1)];
    if (assessmentId) writeWizardDraft(assessmentId, { ...wizardDraft, step: next });
    setStep(next);
  }, [assessmentId, step, stepIsComplete, setStep, wizardDraft]);

  return { stepIsComplete, nextStep };
}
