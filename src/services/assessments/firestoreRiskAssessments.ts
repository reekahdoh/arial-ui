import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { CustomerContextFields } from '../../domain/customerContext';
import { normalizeCustomerContext } from '../../domain/customerContext';
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
  customerContext?: CustomerContextFields;
}

function parseCustomerContextFromDoc(data: Record<string, unknown>): CustomerContextFields | undefined {
  const raw = data.customerContext;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  return normalizeCustomerContext(raw as Partial<CustomerContextFields>);
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
  const customerContext = parseCustomerContextFromDoc(data);

  return {
    id: snap.id,
    ...(name !== undefined ? { name } : {}),
    owner,
    ...(riskOwner !== undefined ? { riskOwner } : {}),
    companyName,
    ...(typeof data.domainId === 'string' ? { domainId: data.domainId } : {}),
    ...(typeof data.domainName === 'string' ? { domainName: data.domainName } : {}),
    ...(customerContext ? { customerContext } : {}),
  };
}

export async function patchRiskAssessmentCustomerContext(
  id: string,
  customerContext: CustomerContextFields,
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
        fileName: customerContext.fileName,
        fileMeta: customerContext.fileMeta,
        websiteUrl: customerContext.websiteUrl,
        emailTitle: customerContext.emailTitle,
        freeformText: customerContext.freeformText,
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

