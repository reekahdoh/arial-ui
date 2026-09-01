import type { ProjectRequirementsFields } from '../../../domain/projectRequirements';

export type DomainKey = 'ai' | 'medical-device';

export type WizardStep = 'name' | 'owner' | 'riskOwner' | 'company' | 'domain' | 'customerDomain' | 'review';

/**
 * Snapshot of an existing assessment handed to the wizard via router state so the
 * review step renders populated immediately (no spinner / empty-template flash) while
 * Firestore reconciles in the background.
 */
export type WizardPreload = {
  name?: string;
  owner?: string;
  riskOwner?: string;
  companyName?: string;
  domainKey?: DomainKey;
  customerContext?: ProjectRequirementsFields;
};

/** Router-state key used to carry a {@link WizardPreload} into the wizard. */
export const WIZARD_PRELOAD_STATE_KEY = 'preloadAssessment';

export type WizardDraftStorage = {
  name?: string;
  owner?: string;
  riskOwner?: string;
  companyName?: string;
  domain?: DomainKey;
  step?: WizardStep;
};

export const WIZARD_STEP_ORDER: WizardStep[] = ['name', 'owner', 'riskOwner', 'company', 'domain', 'customerDomain', 'review'];

export const DOMAIN_OPTIONS: Array<{ key: DomainKey; label: string }> = [
  { key: 'ai', label: 'AI' },
  { key: 'medical-device', label: 'Medical Device' },
];

export const WIZARD_STORAGE_PREFIX = 'aira.riskAssessmentWizard.';

export const linkPanelSx = {
  width: '100%',
  border: '1px solid',
  color: 'inherit',
  cursor: 'pointer',
  font: 'inherit',
  textAlign: 'left',
  textDecoration: 'none',
  '&:hover': { borderColor: 'primary.main' },
  '&:focus-visible': {
    outline: '2px solid',
    outlineColor: 'primary.main',
    outlineOffset: 2,
  },
} as const;
