export type DomainKey = 'ai' | 'who';

export type WizardStep = 'name' | 'owner' | 'riskOwner' | 'company' | 'domain' | 'customerDomain' | 'review';

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
  { key: 'who', label: 'WHO' },
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
