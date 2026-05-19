import {
  buildBackendAssessmentUrl,
  fetchBackendAssessmentById,
} from '../../../services/assessments/backendAssessments';

export async function fetchBackendAssessmentWithBetterNetworkError(
  assessmentId: string,
  signal: AbortSignal,
) {
  try {
    return await fetchBackendAssessmentById(assessmentId, signal);
  } catch (err) {
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      throw new Error(
        `Failed to fetch "${buildBackendAssessmentUrl(assessmentId)}" (network/CORS). In dev, ensure the proxy is running and restart npm start after proxy changes.`,
      );
    }
    throw err;
  }
}
