import { useState } from 'react';
import { emptyProjectRequirements, type ProjectRequirementsFields } from '../../../domain/projectRequirements';
import type { DomainKey, WizardPreload, WizardStep } from './newRiskAssessmentWizardTypes';
import { WIZARD_PRELOAD_STATE_KEY } from './newRiskAssessmentWizardTypes';

/** The assessment id targeted by the current URL, read synchronously for first-render state seeding. */
function assessmentIdFromUrl(): string {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get('assessmentId')?.trim() ?? '';
}

/** True on first render when the URL targets an existing assessment, so we can gate the wizard until remote data loads. */
function hasExistingAssessmentInUrl(): boolean {
  return Boolean(assessmentIdFromUrl());
}

/**
 * Reads the preload snapshot carried in router state (React Router stores location
 * state under `history.state.usr`). Lets the review step render populated on the very
 * first paint when navigating from the list, so there is no spinner or empty-form flash.
 */
function readWizardPreload(): WizardPreload | null {
  if (typeof window === 'undefined' || !hasExistingAssessmentInUrl()) return null;
  const historyState = window.history.state as { usr?: Record<string, unknown> } | null;
  const preload = historyState?.usr?.[WIZARD_PRELOAD_STATE_KEY];
  return preload && typeof preload === 'object' ? (preload as WizardPreload) : null;
}

export function useNewRiskAssessmentWizardState() {
  const preload = readWizardPreload();
  // Whether the wizard opened an already-saved assessment (vs. creating a new one).
  // Used to skip the review-step auto-save so viewing doesn't trigger a redundant write.
  const [startedFromExisting] = useState(hasExistingAssessmentInUrl);
  // Seed from the URL synchronously so a save always targets the existing assessment
  // (never creates a duplicate) even if the user acts before the load effect runs.
  const [assessmentId, setAssessmentId] = useState(assessmentIdFromUrl);
  // Viewing an existing assessment always lands on the review step; only a brand-new
  // assessment starts at step 1, so the empty step-1 template never flashes for a view.
  const [step, setStep] = useState<WizardStep>(() => (hasExistingAssessmentInUrl() ? 'review' : 'name'));
  // Only gate with a spinner when we have no preloaded snapshot to render immediately.
  const [isLoadingExisting, setIsLoadingExisting] = useState(() => hasExistingAssessmentInUrl() && !preload);
  const [name, setName] = useState(() => preload?.name ?? '');
  const [owner, setOwner] = useState(() => preload?.owner ?? '');
  const [riskOwner, setRiskOwner] = useState(() => preload?.riskOwner ?? '');
  const [companyName, setCompanyName] = useState(() => preload?.companyName ?? '');
  const [domain, setDomain] = useState<DomainKey | ''>(() => preload?.domainKey ?? '');
  const [projectRequirements, setProjectRequirements] = useState<ProjectRequirementsFields>(
    () => preload?.customerContext ?? emptyProjectRequirements(),
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [persistTick, setPersistTick] = useState(0);

  return {
    assessmentId,
    setAssessmentId,
    step,
    setStep,
    name,
    setName,
    owner,
    setOwner,
    riskOwner,
    setRiskOwner,
    companyName,
    setCompanyName,
    domain,
    setDomain,
    projectRequirements,
    setProjectRequirements,
    saveError,
    setSaveError,
    isSaving,
    setIsSaving,
    isRunning,
    setIsRunning,
    persistTick,
    setPersistTick,
    isLoadingExisting,
    setIsLoadingExisting,
    startedFromExisting,
    draftSetters: { setName, setOwner, setRiskOwner, setCompanyName, setDomain, setStep, setProjectRequirements },
  };
}
