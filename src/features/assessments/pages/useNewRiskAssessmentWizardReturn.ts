import type { DomainKey, WizardStep } from './newRiskAssessmentWizardTypes';
import type { useProjectRequirementsFileView } from './useProjectRequirementsFileView';
import type { useNewRiskAssessmentWizardState } from './useNewRiskAssessmentWizardState';

type WizardState = ReturnType<typeof useNewRiskAssessmentWizardState>;
type ProjectRequirementsFileView = ReturnType<typeof useProjectRequirementsFileView>;

type WizardReturnParams = {
  state: WizardState;
  step: WizardStep;
  stepIsComplete: boolean;
  nextStep: () => void;
  hasProjectRequirements: boolean;
  allFieldsComplete: boolean;
  handleReviewAction: () => void;
  projectRequirementsSummaryRows: Array<{ type: string; details: string }>;
  projectRequirementsFileView: ProjectRequirementsFileView;
};

function allWizardFieldsComplete(fields: {
  name: string;
  owner: string;
  riskOwner: string;
  companyName: string;
  domain: DomainKey | '';
}): boolean {
  return Boolean(
    fields.name.trim() && fields.owner.trim() && fields.riskOwner.trim() && fields.companyName.trim() && fields.domain,
  );
}

export function buildNewRiskAssessmentWizardReturn({
  state,
  step,
  stepIsComplete,
  nextStep,
  hasProjectRequirements,
  allFieldsComplete,
  handleReviewAction,
  projectRequirementsSummaryRows,
  projectRequirementsFileView,
}: WizardReturnParams) {
  const { assessmentId, name, setName, owner, setOwner, riskOwner, setRiskOwner, companyName, setCompanyName, domain, setDomain, saveError, isSaving, isRunning, projectRequirements } = state;

  return {
    step,
    stepIsComplete,
    nextStep,
    saveError,
    isSaving,
    isRunning,
    domain,
    hasProjectRequirements,
    allFieldsComplete,
    handleReviewAction,
    fields: { name, setName, owner, setOwner, riskOwner, setRiskOwner, companyName, setCompanyName, domain, setDomain },
    paths: {
      assessmentId,
      customerDomainPath: `/customer-domain?assessmentId=${encodeURIComponent(assessmentId)}`,
      projectRequirementsPath: `/assessments/new/project-requirements?assessmentId=${encodeURIComponent(assessmentId)}`,
    },
    summary: {
      projectRequirementsSummaryRows,
      hasProjectRequirements,
      hasProjectRequirementsDocument: Boolean(projectRequirements.fileName),
      onViewProjectRequirementsDocument: projectRequirementsFileView.viewFile,
    },
    projectRequirementsFileView,
  };
}

export { allWizardFieldsComplete };
