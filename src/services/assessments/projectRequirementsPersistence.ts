import {
  emptyProjectRequirements,
  normalizeProjectRequirements,
  type ProjectRequirementsFields,
} from '../../domain/projectRequirements';
import { getRiskAssessment, patchRiskAssessmentProjectRequirements } from './firestoreRiskAssessments';

export async function loadProjectRequirements(assessmentId: string): Promise<ProjectRequirementsFields> {
  const remote = await getRiskAssessment(assessmentId);
  return normalizeProjectRequirements({
    ...emptyProjectRequirements(),
    ...remote?.customerContext,
  });
}

export type PersistProjectRequirementsResult =
  | { ok: true; cloudSynced: boolean }
  | { ok: false; message: string };

export async function persistProjectRequirements(
  assessmentId: string,
  fields: ProjectRequirementsFields,
): Promise<PersistProjectRequirementsResult> {
  try {
    const r = await getRiskAssessment(assessmentId);
    if (!r) {
      return {
        ok: false,
        message:
          'No assessment found in Firestore. Save the risk assessment on the main page first, or use a valid assessment link.',
      };
    }
    await patchRiskAssessmentProjectRequirements(assessmentId, fields);
    return { ok: true, cloudSynced: true };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Failed to save project requirements to Firestore.',
    };
  }
}
