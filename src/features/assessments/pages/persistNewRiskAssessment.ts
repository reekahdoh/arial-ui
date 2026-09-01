import type { ProjectRequirementsFields } from '../../../domain/projectRequirements';
import { isFirebaseConfigured, isUsingFirebaseEmulators } from '../../../services/firebase';
import { createBackendAssessment } from '../../../services/assessments/backendAssessments';
import { getRiskAssessment, upsertRiskAssessment } from '../../../services/assessments/firestoreRiskAssessments';
import { withTimeout } from '../../../utils/withTimeout';
import { extractBackendAssessmentId } from './newRiskAssessmentWizardHelpers';
import { clearWizardDraft } from './newRiskAssessmentWizardStorage';
import type { DomainKey } from './newRiskAssessmentWizardTypes';

export type PersistRiskAssessmentInput = {
  assessmentId: string;
  name: string;
  owner: string;
  riskOwner: string;
  companyName: string;
  domain: DomainKey;
  projectRequirements: ProjectRequirementsFields;
};

const DOMAIN_BY_KEY: Record<DomainKey, { domainId: DomainKey; domainName: string }> = {
  ai: { domainId: 'ai', domainName: 'AI' },
  'medical-device': { domainId: 'medical-device', domainName: 'Medical Device' },
};

const FIRESTORE_TIMEOUT_MS = isUsingFirebaseEmulators() ? 5_000 : 15_000;
const BACKEND_CREATE_TIMEOUT_MS = isUsingFirebaseEmulators() ? 10_000 : 45_000;

async function resolveBackendAssessmentId(localId: string): Promise<string> {
  const trimmed = localId.trim();
  if (!trimmed || !isFirebaseConfigured()) return trimmed;
  try {
    const existing = await withTimeout(getRiskAssessment(trimmed), FIRESTORE_TIMEOUT_MS, 'Loading assessment');
    return existing?.backendAssessmentId?.trim() || existing?.id || trimmed;
  } catch {
    return trimmed;
  }
}

async function createBackendAssessmentId(owner: string, name: string, companyName: string): Promise<string> {
  const result = await withTimeout(
    createBackendAssessment({
      userId: owner,
      name,
      description: companyName ? `Risk assessment for ${companyName}` : 'Risk assessment',
    }),
    BACKEND_CREATE_TIMEOUT_MS,
    'Creating assessment',
  );
  if (!result.ok) {
    throw new Error(`POST /assessments returned ${result.status}: ${result.raw || '(empty response)'}`);
  }
  const returnedAssessmentId = extractBackendAssessmentId(result.data) ?? extractBackendAssessmentId(result.raw);
  if (!returnedAssessmentId) throw new Error('POST /assessments did not return an assessment id.');
  return returnedAssessmentId;
}

function clearDraftsAfterSave(localId: string, backendId: string) {
  if (localId && localId !== backendId) clearWizardDraft(localId);
  clearWizardDraft(backendId);
}

export async function persistNewRiskAssessment(input: PersistRiskAssessmentInput): Promise<string> {
  const baseDraft = {
    name: input.name.trim(),
    owner: input.owner.trim(),
    riskOwner: input.riskOwner.trim(),
    companyName: input.companyName.trim(),
    domain: input.domain,
    customerContext: input.projectRequirements,
  };

  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured. Risk assessments must be saved to Firestore.');
  }

  let backendAssessmentId = await resolveBackendAssessmentId(input.assessmentId);
  if (!backendAssessmentId) {
    backendAssessmentId = await createBackendAssessmentId(baseDraft.owner, baseDraft.name, baseDraft.companyName);
  }

  const domainMeta = DOMAIN_BY_KEY[input.domain];
  await withTimeout(
    upsertRiskAssessment(backendAssessmentId, {
      backendAssessmentId,
      name: baseDraft.name,
      owner: baseDraft.owner,
      riskOwner: baseDraft.riskOwner,
      companyName: baseDraft.companyName,
      domainId: domainMeta.domainId,
      domainName: domainMeta.domainName,
      domainKey: input.domain,
      customerContext: baseDraft.customerContext,
    }),
    FIRESTORE_TIMEOUT_MS,
    'Saving to Firestore',
  );

  clearDraftsAfterSave(input.assessmentId, backendAssessmentId);
  return backendAssessmentId;
}
