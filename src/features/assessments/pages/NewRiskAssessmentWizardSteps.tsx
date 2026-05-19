import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { RiskAssessmentOvalSection } from '../../../components/ui/RiskAssessmentOvalSection';
import { ReviewWizardStep } from './NewRiskAssessmentWizardReviewStep';
import { DomainSelectFields, EditAccessory, WizardTextFieldStep } from './NewRiskAssessmentWizardStepParts';
import { linkPanelSx, type DomainKey, type WizardStep } from './newRiskAssessmentWizardTypes';

export type WizardStepContentProps = {
  step: WizardStep;
  nextButton: ReactNode;
  fields: {
    name: string;
    setName: (value: string) => void;
    owner: string;
    setOwner: (value: string) => void;
    riskOwner: string;
    setRiskOwner: (value: string) => void;
    companyName: string;
    setCompanyName: (value: string) => void;
    domain: DomainKey | '';
    setDomain: (domain: DomainKey) => void;
  };
  paths: {
    assessmentId: string;
    customerDomainPath: string;
    projectRequirementsPath: string;
  };
  summary: {
    projectRequirementsSummaryRows: Array<{ type: string; details: string }>;
    hasProjectRequirements: boolean;
    hasProjectRequirementsDocument: boolean;
    onViewProjectRequirementsDocument: (event: MouseEvent | KeyboardEvent) => void;
  };
};

function DomainWizardStep({ fields, nextButton }: Pick<WizardStepContentProps, 'fields' | 'nextButton'>) {
  return (
    <>
      <RiskAssessmentOvalSection
        title="Authoritative Domain"
        description="A focused area of the business or system where related risks are grouped so they can be assessed, owned, and managed consistently"
      >
        <DomainSelectFields domain={fields.domain} setDomain={fields.setDomain} />
      </RiskAssessmentOvalSection>
      {nextButton}
    </>
  );
}

function CustomerDomainWizardStep({ paths, nextButton }: Pick<WizardStepContentProps, 'paths' | 'nextButton'>) {
  return (
    <>
      <RiskAssessmentOvalSection
        component={RouterLink}
        {...{ to: paths.customerDomainPath }}
        title="Customer Domain"
        description="Capture customer-specific domain references and context for this assessment."
        titleAccessory={<EditAccessory />}
        sx={linkPanelSx}
      >
        {null}
      </RiskAssessmentOvalSection>
      {nextButton}
    </>
  );
}

const TEXT_FIELD_STEPS: Record<
  Exclude<WizardStep, 'domain' | 'customerDomain' | 'review'>,
  { title: string; description: string; label: string; placeholder: string; value: (f: WizardStepContentProps['fields']) => string; onChange: (f: WizardStepContentProps['fields']) => (v: string) => void }
> = {
  name: {
    title: 'Name',
    description: 'The name for this Risk Assessment',
    label: 'Name',
    placeholder: 'e.g. Vehicle Colour Classification Assessment',
    value: (f) => f.name,
    onChange: (f) => f.setName,
  },
  owner: {
    title: 'Owner',
    description: 'Responsible for setting up this Risk Assessment',
    label: 'Owner',
    placeholder: 'e.g. Jane Doe',
    value: (f) => f.owner,
    onChange: (f) => f.setOwner,
  },
  riskOwner: {
    title: 'Risk Owner',
    description: 'Responsible for owning and managing risk decisions during this assessment',
    label: 'Risk Owner',
    placeholder: 'e.g. Jane Doe',
    value: (f) => f.riskOwner,
    onChange: (f) => f.setRiskOwner,
  },
  company: {
    title: 'Company',
    description: 'The company undergoing the Risk Assessment',
    label: 'Company Name',
    placeholder: 'e.g. Futurist Ventures',
    value: (f) => f.companyName,
    onChange: (f) => f.setCompanyName,
  },
};

function TextFieldWizardStep({
  step,
  fields,
  nextButton,
}: Pick<WizardStepContentProps, 'fields' | 'nextButton'> & { step: keyof typeof TEXT_FIELD_STEPS }) {
  const config = TEXT_FIELD_STEPS[step];
  return (
    <WizardTextFieldStep
      title={config.title}
      description={config.description}
      label={config.label}
      value={config.value(fields)}
      placeholder={config.placeholder}
      onChange={config.onChange(fields)}
      nextButton={nextButton}
    />
  );
}

export function NewRiskAssessmentWizardStepContent({ step, nextButton, fields, paths, summary }: WizardStepContentProps) {
  if (step in TEXT_FIELD_STEPS) {
    return <TextFieldWizardStep step={step as keyof typeof TEXT_FIELD_STEPS} fields={fields} nextButton={nextButton} />;
  }
  if (step === 'domain') return <DomainWizardStep fields={fields} nextButton={nextButton} />;
  if (step === 'customerDomain') return <CustomerDomainWizardStep paths={paths} nextButton={nextButton} />;
  return <ReviewWizardStep {...fields} {...paths} {...summary} />;
}
