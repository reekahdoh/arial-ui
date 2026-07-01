import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
  serverTimestamp,
  setDoc,
  type Timestamp,
} from 'firebase/firestore';
import type { AssessmentSummary } from '../../domain/assessment';
import type { RiskSeverity, WorkflowStatus } from '../../constants/riskStatus';
import type { ProjectRequirementsFields } from '../../domain/projectRequirements';
import { customerContextForFirestore, normalizeProjectRequirements } from '../../domain/projectRequirements';
import { FIRESTORE_COLLECTION_RISK_ASSESSMENTS } from '../../constants/firestoreCollections';
import { getFirebase, isFirebaseConfigured } from '../firebase';

export interface RiskAssessmentWrite {
  backendAssessmentId: string;
  name: string;
  owner: string;
  riskOwner?: string;
  companyName: string;
  domainId?: string;
  domainName?: string;
  domainKey?: 'ai' | 'who';
  customerContext?: ProjectRequirementsFields;
  severity?: RiskSeverity;
  workflowStatus?: WorkflowStatus;
}

export interface RiskAssessmentRead extends AssessmentSummary {
  id: string;
  backendAssessmentId?: string;
  name?: string;
  owner: string;
  riskOwner?: string;
  companyName: string;
  domainId?: string;
  domainName?: string;
  domainKey?: 'ai' | 'who';
  customerContext?: ProjectRequirementsFields;
}

function stringFromDoc(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function domainKeyFromUnknown(value: unknown): 'ai' | 'who' | undefined {
  return value === 'ai' || value === 'who' ? value : undefined;
}

function severityFromUnknown(value: unknown): RiskSeverity {
  return value === 'low' || value === 'medium' || value === 'high' || value === 'critical'
    ? value
    : 'medium';
}

function workflowStatusFromUnknown(value: unknown): WorkflowStatus {
  return value === 'draft' || value === 'in_review' || value === 'approved' || value === 'archived'
    ? value
    : 'draft';
}

function dateStringFromDoc(value: unknown): string {
  if (typeof value === 'string' && value.trim()) return value;
  if (value && typeof value === 'object' && typeof (value as Timestamp).toDate === 'function') {
    const date = (value as Timestamp).toDate();
    if (date instanceof Date && !Number.isNaN(date.getTime())) return date.toISOString();
  }
  return new Date().toISOString();
}

function parseProjectRequirementsFromDoc(data: Record<string, unknown>): ProjectRequirementsFields | undefined {
  const raw = data.customerContext;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  return normalizeProjectRequirements(raw as Partial<ProjectRequirementsFields>);
}

function assessmentTitle(data: Record<string, unknown>, name: string | undefined, companyName: string): string {
  return stringFromDoc(data.title) ?? name ?? `Risk assessment - ${companyName}`;
}

function optionalReadFields(
  data: Record<string, unknown>,
  values: {
    backendAssessmentId?: string;
    name?: string;
    riskOwner?: string;
    domainKey?: 'ai' | 'who';
    customerContext?: ProjectRequirementsFields;
  },
): Partial<RiskAssessmentRead> {
  return {
    ...(values.backendAssessmentId ? { backendAssessmentId: values.backendAssessmentId } : {}),
    ...(values.name ? { name: values.name } : {}),
    ...(values.riskOwner ? { riskOwner: values.riskOwner } : {}),
    ...(typeof data.domainId === 'string' ? { domainId: data.domainId } : {}),
    ...(typeof data.domainName === 'string' ? { domainName: data.domainName } : {}),
    ...(values.domainKey ? { domainKey: values.domainKey } : {}),
    ...(values.customerContext ? { customerContext: values.customerContext } : {}),
  };
}

function requireAuthenticatedUid(): { db: ReturnType<typeof getFirebase>['db']; uid: string } {
  if (!isFirebaseConfigured()) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }
  const { db, auth } = getFirebase();
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error('NOT_AUTHENTICATED');
  }
  return { db, uid };
}

function ownedRiskAssessmentsQuery(db: ReturnType<typeof getFirebase>['db'], uid: string) {
  return query(
    collection(db, FIRESTORE_COLLECTION_RISK_ASSESSMENTS),
    where('ownerUid', '==', uid),
    orderBy('updatedAt', 'desc'),
  );
}

function mapRiskAssessmentDoc(id: string, data: Record<string, unknown>): RiskAssessmentRead | null {
  const owner = stringFromDoc(data.owner);
  const companyName = stringFromDoc(data.companyName);
  if (!owner || !companyName) return null;

  const name = stringFromDoc(data.name);
  const backendAssessmentId = stringFromDoc(data.backendAssessmentId);
  const riskOwner = stringFromDoc(data.riskOwner);
  const projectRequirements = parseProjectRequirementsFromDoc(data);
  const domainKey = domainKeyFromUnknown(data.domainKey);
  const title = assessmentTitle(data, name, companyName);
  const updatedAt = dateStringFromDoc(data.updatedAt);
  const severity = severityFromUnknown(data.severity);
  const workflowStatus = workflowStatusFromUnknown(data.workflowStatus);

  return {
    id,
    title,
    ownerName: stringFromDoc(data.ownerName) ?? owner,
    updatedAt,
    severity,
    workflowStatus,
    owner,
    companyName,
    ...optionalReadFields(data, {
      backendAssessmentId,
      name,
      riskOwner,
      domainKey,
      customerContext: projectRequirements,
    }),
  };
}

export async function listRiskAssessments(): Promise<RiskAssessmentRead[]> {
  const { db, uid } = requireAuthenticatedUid();
  const snap = await getDocs(ownedRiskAssessmentsQuery(db, uid));
  return snap.docs
    .map((d) => mapRiskAssessmentDoc(d.id, d.data() as Record<string, unknown>))
    .filter((d): d is RiskAssessmentRead => d !== null);
}

/** Prefer the backend assessment id used by the AIRA API when it differs from the Firestore doc id. */
export async function resolveBackendAssessmentId(assessmentId: string): Promise<string> {
  const trimmed = assessmentId.trim();
  if (!trimmed) return '';
  if (!isFirebaseConfigured()) return trimmed;
  const remote = await getRiskAssessment(trimmed);
  return remote?.backendAssessmentId?.trim() || remote?.id || trimmed;
}

export async function getRiskAssessment(id: string): Promise<RiskAssessmentRead | null> {
  if (!isFirebaseConfigured()) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }
  const { db } = getFirebase();
  const snap = await getDoc(doc(db, FIRESTORE_COLLECTION_RISK_ASSESSMENTS, id));
  if (!snap.exists()) return null;
  return mapRiskAssessmentDoc(snap.id, snap.data() as Record<string, unknown>);
}

export async function patchRiskAssessmentProjectRequirements(
  id: string,
  projectRequirements: ProjectRequirementsFields,
): Promise<void> {
  if (!isFirebaseConfigured()) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }
  const { db } = getFirebase();
  const ref = doc(db, FIRESTORE_COLLECTION_RISK_ASSESSMENTS, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    throw new Error('ASSESSMENT_NOT_FOUND');
  }
  await setDoc(
    ref,
    {
      customerContext: customerContextForFirestore(projectRequirements),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function deleteRiskAssessment(id: string): Promise<void> {
  if (!isFirebaseConfigured()) {
    return;
  }
  const { db } = getFirebase();
  await deleteDoc(doc(db, FIRESTORE_COLLECTION_RISK_ASSESSMENTS, id));
}

function buildRiskAssessmentUpsertPayload(input: RiskAssessmentWrite, uid: string) {
  const title = input.name || (input.companyName ? `Risk assessment - ${input.companyName}` : 'Risk assessment');
  const customerContext = input.customerContext
    ? customerContextForFirestore(input.customerContext)
    : undefined;
  return {
    backendAssessmentId: input.backendAssessmentId,
    name: input.name,
    title,
    owner: input.owner,
    ownerUid: uid,
    ownerName: input.owner,
    ...(input.riskOwner ? { riskOwner: input.riskOwner } : {}),
    companyName: input.companyName,
    ...(input.domainId ? { domainId: input.domainId } : {}),
    ...(input.domainName ? { domainName: input.domainName } : {}),
    ...(input.domainKey ? { domainKey: input.domainKey } : {}),
    ...(customerContext ? { customerContext } : {}),
    severity: input.severity ?? 'medium',
    workflowStatus: input.workflowStatus ?? 'draft',
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  };
}

export async function upsertRiskAssessment(id: string, input: RiskAssessmentWrite): Promise<void> {
  const { db, uid } = requireAuthenticatedUid();
  const ref = doc(db, FIRESTORE_COLLECTION_RISK_ASSESSMENTS, id);
  await setDoc(ref, buildRiskAssessmentUpsertPayload(input, uid), { merge: true });
}

