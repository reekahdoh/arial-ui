import type { WizardDraftStorage } from './newRiskAssessmentWizardTypes';
import { WIZARD_STORAGE_PREFIX } from './newRiskAssessmentWizardTypes';

function wizardStorageKey(assessmentId: string): string {
  return `${WIZARD_STORAGE_PREFIX}${assessmentId}`;
}

export function readWizardDraft(assessmentId: string): WizardDraftStorage | null {
  try {
    const raw = localStorage.getItem(wizardStorageKey(assessmentId));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as WizardDraftStorage;
  } catch {
    return null;
  }
}

export function writeWizardDraft(assessmentId: string, draft: WizardDraftStorage) {
  localStorage.setItem(wizardStorageKey(assessmentId), JSON.stringify(draft));
}

export function clearWizardDraft(assessmentId: string) {
  localStorage.removeItem(wizardStorageKey(assessmentId));
}
