import { projectRequirementsRows } from './newRiskAssessmentWizardHelpers';
import { useNewRiskAssessmentWizardActions } from './useNewRiskAssessmentWizardActions';
import { useRunDraftSync, useWizardInitialLoad } from './useNewRiskAssessmentWizardLoad';
import { useNewRiskAssessmentWizardNavigation } from './useNewRiskAssessmentWizardNavigation';
import { useNewRiskAssessmentWizardReviewAutoSave } from './useNewRiskAssessmentWizardReviewAutoSave';
import { allWizardFieldsComplete, buildNewRiskAssessmentWizardReturn } from './useNewRiskAssessmentWizardReturn';
import { useNewRiskAssessmentWizardState } from './useNewRiskAssessmentWizardState';
import { useProjectRequirementsFileView } from './useProjectRequirementsFileView';

export function useNewRiskAssessmentWizard() {
  const state = useNewRiskAssessmentWizardState();
  const { assessmentId, step, setStep, name, owner, riskOwner, companyName, domain, projectRequirements, isSaving, persistTick, setAssessmentId, setName, setOwner, setRiskOwner, setCompanyName, setSaveError, setIsSaving, setIsRunning, setPersistTick, draftSetters } = state;

  useWizardInitialLoad(setAssessmentId, draftSetters);
  useRunDraftSync(assessmentId, { name, owner, riskOwner, companyName, domain, projectRequirements }, persistTick);

  const projectRequirementsFileView = useProjectRequirementsFileView({
    assessmentId,
    preferredFileName: projectRequirements.fileName,
  });

  const { stepIsComplete, nextStep } = useNewRiskAssessmentWizardNavigation({
    assessmentId,
    step,
    setStep,
    name,
    owner,
    riskOwner,
    companyName,
    domain,
  });

  const actions = useNewRiskAssessmentWizardActions({
    assessmentId,
    name,
    owner,
    riskOwner,
    companyName,
    domain,
    projectRequirements,
    setAssessmentId,
    setName,
    setOwner,
    setRiskOwner,
    setCompanyName,
    setSaveError,
    setIsSaving,
    setIsRunning,
    setPersistTick,
  });

  useNewRiskAssessmentWizardReviewAutoSave({ step, name, owner, riskOwner, companyName, domain, isSaving, save: actions.save });

  const projectRequirementsSummaryRows = projectRequirementsRows(projectRequirements);
  const hasProjectRequirements = projectRequirementsSummaryRows.length > 0;

  return buildNewRiskAssessmentWizardReturn({
    state,
    step,
    stepIsComplete,
    nextStep,
    hasProjectRequirements,
    allFieldsComplete: allWizardFieldsComplete({ name, owner, riskOwner, companyName, domain }),
    handleReviewAction: () => void actions.handleReviewAction(hasProjectRequirements),
    projectRequirementsSummaryRows,
    projectRequirementsFileView,
  });
}
