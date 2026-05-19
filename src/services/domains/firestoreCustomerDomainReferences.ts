import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
  type Timestamp,
} from 'firebase/firestore';
import { FIRESTORE_COLLECTION_CUSTOMER_DOMAIN_REFERENCES } from '../../constants/firestoreCollections';
import { getFirebase, isFirebaseConfigured } from '../firebase';

export type CustomerDomainReferenceKind = 'website' | 'document';

export interface CustomerDomainReferenceDoc {
  id: string;
  assessmentId: string;
  kind: CustomerDomainReferenceKind;
  value: string;
  createdAt?: string;
}

type RawCustomerDomainReference = {
  id: string;
  assessmentId: unknown;
  kind: unknown;
  value: unknown;
  createdAt?: unknown;
};

function formatCreatedAt(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && typeof (value as Timestamp).toDate === 'function') {
    const date = (value as Timestamp).toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date.toISOString() : undefined;
  }
  return undefined;
}

function isCustomerDomainReferenceDoc(value: RawCustomerDomainReference): value is CustomerDomainReferenceDoc {
  return (
    typeof value.id === 'string' &&
    typeof value.assessmentId === 'string' &&
    (value.kind === 'website' || value.kind === 'document') &&
    typeof value.value === 'string'
  );
}

export async function listCustomerDomainReferencesByAssessment(
  assessmentId: string,
): Promise<CustomerDomainReferenceDoc[]> {
  if (!isFirebaseConfigured()) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }
  const id = assessmentId.trim();
  if (!id) return [];

  const { db } = getFirebase();
  const q = query(
    collection(db, FIRESTORE_COLLECTION_CUSTOMER_DOMAIN_REFERENCES),
    where('assessmentId', '==', id),
  );
  const snap = await getDocs(q);
  const refs = snap.docs
    .map((d) => {
      const data = d.data() as Record<string, unknown>;
      const raw: RawCustomerDomainReference = {
        id: d.id,
        assessmentId: data.assessmentId,
        kind: data.kind,
        value: data.value,
        createdAt: data.createdAt,
      };
      return raw;
    })
    .filter(isCustomerDomainReferenceDoc)
    .map((ref) => ({
      ...ref,
      createdAt: formatCreatedAt(ref.createdAt),
    }));

  refs.sort((a, b) => {
    const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
    const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
    return tb - ta;
  });
  return refs;
}

export async function addCustomerDomainReference(input: {
  assessmentId: string;
  kind: CustomerDomainReferenceKind;
  value: string;
}): Promise<string> {
  if (!isFirebaseConfigured()) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }
  const assessmentId = input.assessmentId.trim();
  if (!assessmentId) {
    throw new Error('ASSESSMENT_ID_REQUIRED');
  }

  const { db } = getFirebase();
  const ref = await addDoc(collection(db, FIRESTORE_COLLECTION_CUSTOMER_DOMAIN_REFERENCES), {
    assessmentId,
    kind: input.kind,
    value: input.value,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteCustomerDomainReferencesByAssessment(assessmentId: string): Promise<void> {
  if (!isFirebaseConfigured()) {
    return;
  }
  const refs = await listCustomerDomainReferencesByAssessment(assessmentId);
  const { db } = getFirebase();
  await Promise.all(
    refs.map((ref) => deleteDoc(doc(db, FIRESTORE_COLLECTION_CUSTOMER_DOMAIN_REFERENCES, ref.id))),
  );
}
