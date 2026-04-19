import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import { FIRESTORE_COLLECTION_AUTHORATIVE_REFERENCES } from '../../constants/firestoreCollections';
import { getFirebase, isFirebaseConfigured } from '../firebase';

export type AuthorativeReferenceKind = 'website' | 'document';

export interface AuthorativeReferenceDoc {
  id: string;
  domainId: string;
  kind: AuthorativeReferenceKind;
  value: string;
  createdAt?: string;
}

type RawAuthorativeReference = {
  id: string;
  domainId: unknown;
  kind: unknown;
  value: unknown;
  createdAt?: unknown;
};

function isAuthorativeReferenceDoc(value: RawAuthorativeReference): value is AuthorativeReferenceDoc {
  return (
    typeof value.id === 'string' &&
    typeof value.domainId === 'string' &&
    (value.kind === 'website' || value.kind === 'document') &&
    typeof value.value === 'string'
  );
}

function formatCreatedAt(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && typeof (value as { toDate?: unknown }).toDate === 'function') {
    const d = (value as { toDate: () => Date }).toDate();
    return d instanceof Date && !Number.isNaN(d.getTime()) ? d.toISOString() : undefined;
  }
  return undefined;
}

export async function listAuthorativeReferencesByDomain(domainId: string): Promise<AuthorativeReferenceDoc[]> {
  if (!isFirebaseConfigured()) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }
  const { db } = getFirebase();
  const q = query(collection(db, FIRESTORE_COLLECTION_AUTHORATIVE_REFERENCES), where('domainId', '==', domainId));
  const snap = await getDocs(q);
  const rows = snap.docs
    .map((d) => {
      const data = d.data() as Record<string, unknown>;
      const raw: RawAuthorativeReference = {
        id: d.id,
        domainId: data.domainId,
        kind: data.kind,
        value: data.value,
        createdAt: data.createdAt,
      };
      return raw;
    })
    .filter(isAuthorativeReferenceDoc)
    .map((d) => ({
      id: d.id,
      domainId: d.domainId,
      kind: d.kind,
      value: d.value,
      createdAt: formatCreatedAt(d.createdAt),
    }));

  rows.sort((a, b) => {
    const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
    const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
    return tb - ta;
  });
  return rows;
}

export async function addAuthorativeReference(input: {
  domainId: string;
  kind: AuthorativeReferenceKind;
  value: string;
}): Promise<string> {
  if (!isFirebaseConfigured()) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }
  const { db } = getFirebase();
  const ref = await addDoc(collection(db, FIRESTORE_COLLECTION_AUTHORATIVE_REFERENCES), {
    domainId: input.domainId,
    kind: input.kind,
    value: input.value,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

