import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { ProjectRequirementsFields } from '../../domain/projectRequirements';
import { normalizeProjectRequirements } from '../../domain/projectRequirements';
import { FIRESTORE_COLLECTION_RISK_ASSESSMENTS } from '../../constants/firestoreCollections';
import { getFirebase, isFirebaseConfigured } from '../firebase';

export interface RiskAssessmentWrite {
  name: string;
  owner: string;
  riskOwner?: string;
  companyName: string;
  domainId?: string;
  domainName?: string;
}

export interface RiskAssessmentRead {
  id: string;
  name?: string;
  owner: string;
  riskOwner?: string;
  companyName: string;
  domainId?: string;
  domainName?: string;
  customerContext?: ProjectRequirementsFields;
}

function parseProjectRequirementsFromDoc(data: Record<string, unknown>): ProjectRequirementsFields | undefined {
  const raw = data.customerContext;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  return normalizeProjectRequirements(raw as Partial<ProjectRequirementsFields>);
}

export async function getRiskAssessment(id: string): Promise<RiskAssessmentRead | null> {
  if (!isFirebaseConfigured()) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }
  const { db } = getFirebase();
  const snap = await getDoc(doc(db, FIRESTORE_COLLECTION_RISK_ASSESSMENTS, id));
  if (!snap.exists()) return null;
  const data = snap.data() as Record<string, unknown>;
  const owner = data.owner;
  const companyName = data.companyName;
  if (typeof owner !== 'string' || typeof companyName !== 'string') return null;
  const name = typeof data.name === 'string' ? data.name : undefined;
  const riskOwner = typeof data.riskOwner === 'string' ? data.riskOwner : undefined;
  const projectRequirements = parseProjectRequirementsFromDoc(data);

  return {
    id: snap.id,
    ...(name !== undefined ? { name } : {}),
    owner,
    ...(riskOwner !== undefined ? { riskOwner } : {}),
    companyName,
    ...(typeof data.domainId === 'string' ? { domainId: data.domainId } : {}),
    ...(typeof data.domainName === 'string' ? { domainName: data.domainName } : {}),
    ...(projectRequirements ? { customerContext: projectRequirements } : {}),
  };
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
      customerContext: {
        fileName: projectRequirements.fileName,
        fileMeta: projectRequirements.fileMeta,
        websiteUrl: projectRequirements.websiteUrl,
        emailTitle: projectRequirements.emailTitle,
        freeformText: projectRequirements.freeformText,
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function upsertRiskAssessment(id: string, input: RiskAssessmentWrite): Promise<void> {
  if (!isFirebaseConfigured()) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }
  const { db } = getFirebase();
  const ref = doc(db, FIRESTORE_COLLECTION_RISK_ASSESSMENTS, id);
  await setDoc(
    ref,
    {
      name: input.name,
      owner: input.owner,
      ...(input.riskOwner !== undefined ? { riskOwner: input.riskOwner } : {}),
      companyName: input.companyName,
      ...(input.domainId ? { domainId: input.domainId } : {}),
      ...(input.domainName ? { domainName: input.domainName } : {}),
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
}

