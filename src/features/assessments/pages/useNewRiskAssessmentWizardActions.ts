import { useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { ProjectRequirementsFields } from '../../../domain/projectRequirements';
import { isUsingFirebaseEmulators } from '../../../services/firebase';
import { withTimeout } from '../../../utils/withTimeout';
import { persistNewRiskAssessment } from './persistNewRiskAssessment';
import type { DomainKey } from './newRiskAssessmentWizardTypes';

const SAVE_TIMEOUT_MS = isUsingFirebaseEmulators() ? 15_000 : 60_000;

type WizardSaveState = {
  assessmentId: string;
  name: string;
  owner: string;
  riskOwner: string;
  companyName: string;
  domain: DomainKey | '';
  projectRequirements: ProjectRequirementsFields;
  setAssessmentId: (id: string) => void;
  setName: (v: string) => void;
  setOwner: (v: string) => void;
  setRiskOwner: (v: string) => void;
  setCompanyName: (v: string) => void;
  setSaveError: (msg: string | null) => void;
  setIsSaving: (v: boolean) => void;
  setIsRunning: (v: boolean) => void;
  setPersistTick: (fn: (t: number) => number) => void;
};

export function useNewRiskAssessmentWizardActions(state: WizardSaveState) {
  const [, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const save = useCallback(async (): Promise<string | null> => {
    if (!state.domain) {
      state.setSaveError('Please choose an Authoritative Domain before saving.');
      return null;
    }
    state.setSaveError(null);
    state.setIsSaving(true);
    try {
      const backendAssessmentId = await withTimeout(
        persistNewRiskAssessment({
          assessmentId: state.assessmentId,
          name: state.name,
          owner: state.owner,
          riskOwner: state.riskOwner,
          companyName: state.companyName,
          domain: state.domain,
          projectRequirements: state.projectRequirements,
        }),
        SAVE_TIMEOUT_MS,
        'Save',
      );
      state.setAssessmentId(backendAssessmentId);
      setSearchParams({ assessmentId: backendAssessmentId }, { replace: true });
      state.setName(state.name.trim());
      state.setOwner(state.owner.trim());
      state.setRiskOwner(state.riskOwner.trim());
      state.setCompanyName(state.companyName.trim());
      state.setPersistTick((t) => t + 1);
      return backendAssessmentId;
    } catch (err) {
      state.setSaveError(err instanceof Error ? err.message : 'Failed to save risk assessment.');
      return null;
    } finally {
      state.setIsSaving(false);
    }
  }, [
    setSearchParams,
    state.assessmentId,
    state.companyName,
    state.domain,
    state.name,
    state.owner,
    state.projectRequirements,
    state.riskOwner,
    state.setAssessmentId,
    state.setCompanyName,
    state.setName,
    state.setOwner,
    state.setPersistTick,
    state.setRiskOwner,
    state.setSaveError,
    state.setIsSaving,
  ]);

  const runRiskAssessment = async () => {
    const backendId = state.assessmentId.trim();
    if (!backendId) {
      state.setSaveError('Save the risk assessment first.');
      return;
    }
    state.setSaveError(null);
    state.setIsRunning(true);
    try {
      navigate(`/assessments/running?assessmentId=${encodeURIComponent(backendId)}`, {
        state: { assessmentId: backendId, localAssessmentId: state.assessmentId },
      });
    } catch (err) {
      state.setSaveError(err instanceof Error ? err.message : 'Failed to run risk assessment');
    } finally {
      state.setIsRunning(false);
    }
  };

  const handleReviewAction = async (hasProjectRequirements: boolean) => {
    const savedId = await save();
    if (!savedId) return;
    if (hasProjectRequirements) {
      await runRiskAssessment();
      return;
    }
    navigate(`/assessments/new/project-requirements?assessmentId=${encodeURIComponent(savedId)}`);
  };

  return { save, runRiskAssessment, handleReviewAction };
}
