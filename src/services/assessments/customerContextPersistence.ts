import {
  emptyCustomerContext,
  normalizeCustomerContext,
  type CustomerContextFields,
} from '../../domain/customerContext';
import { isFirebaseConfigured } from '../firebase';
import { getLocalAssessment, upsertLocalAssessment } from './localAssessments';
import { getRiskAssessment, patchRiskAssessmentCustomerContext } from './firestoreRiskAssessments';

/**
 * Merges local draft + Firestore (remote wins on overlap). Works offline-first when Firebase is off.
 */
export async function loadCustomerContext(assessmentId: string): Promise<CustomerContextFields> {
  let remote: Partial<CustomerContextFields> | undefined;
  if (isFirebaseConfigured()) {
    try {
      const r = await getRiskAssessment(assessmentId);
      if (r?.customerContext) remote = r.customerContext;
    } catch {
      // ignore
    }
  }

  const local = getLocalAssessment(assessmentId);
  const localPart = local?.draft.customerContext;

  return normalizeCustomerContext({
    ...emptyCustomerContext(),
    ...localPart,
    ...remote,
  });
}

export type PersistCustomerContextResult =
  | { ok: true; cloudSynced: boolean }
  | { ok: false; message: string };

export async function persistCustomerContext(
  assessmentId: string,
  fields: CustomerContextFields,
): Promise<PersistCustomerContextResult> {
  const local = getLocalAssessment(assessmentId);
  const now = new Date().toISOString();

  if (local) {
    upsertLocalAssessment({
      ...local,
      draft: { ...local.draft, customerContext: fields },
      updatedAt: now,
    });
  }

  if (!isFirebaseConfigured()) {
    if (!local) {
      return {
        ok: false,
        message:
          'Save the risk assessment on the main page first so it exists in local storage, then return here.',
      };
    }
    return { ok: true, cloudSynced: false };
  }

  let remoteExists = false;
  try {
    const r = await getRiskAssessment(assessmentId);
    remoteExists = r !== null;
  } catch {
    remoteExists = false;
  }

  if (!remoteExists) {
    if (!local) {
      return {
        ok: false,
        message:
          'No assessment found. Save the risk assessment on the main page first, or use a valid assessment link.',
      };
    }
    return { ok: true, cloudSynced: false };
  }

  await patchRiskAssessmentCustomerContext(assessmentId, fields);
  return { ok: true, cloudSynced: true };
}
