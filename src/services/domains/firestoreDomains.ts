import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { FIRESTORE_COLLECTION_DOMAINS } from '../../constants/firestoreCollections';
import { getFirebase, isFirebaseConfigured } from '../firebase';

export interface DomainDoc {
  id: string;
  name: string;
}

/** Route keys match seeded Domain document IDs (`Domain/ai`, `Domain/who`). */
export type DomainRouteKey = 'ai' | 'who';

export async function getDomainByDocId(id: string): Promise<DomainDoc | null> {
  if (!isFirebaseConfigured()) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }
  const { db } = getFirebase();
  const snap = await getDoc(doc(db, FIRESTORE_COLLECTION_DOMAINS, id));
  if (!snap.exists()) return null;
  const data = snap.data() as { name?: unknown };
  const name = typeof data.name === 'string' ? data.name : id;
  return { id: snap.id, name };
}

export async function getDomainByName(name: string): Promise<DomainDoc | null> {
  if (!isFirebaseConfigured()) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }
  const { db } = getFirebase();
  const q = query(collection(db, FIRESTORE_COLLECTION_DOMAINS), where('name', '==', name));
  const snap = await getDocs(q);
  const docSnap = snap.docs[0];
  if (!docSnap) return null;
  const data = docSnap.data() as { name?: unknown };
  return typeof data.name === 'string' ? { id: docSnap.id, name: data.name } : null;
}

/** Prefer document id (routing + seed); fall back to display name query. */
export async function getDomainByRouteKey(routeKey: DomainRouteKey): Promise<DomainDoc | null> {
  const byId = await getDomainByDocId(routeKey);
  if (byId) return byId;
  const label = routeKey === 'ai' ? 'AI' : 'WHO';
  return getDomainByName(label);
}

export async function listDomains(): Promise<DomainDoc[]> {
  if (!isFirebaseConfigured()) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }
  const { db } = getFirebase();
  const snap = await getDocs(collection(db, FIRESTORE_COLLECTION_DOMAINS));
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as { name?: unknown }) }))
    .filter((d): d is DomainDoc => typeof d.id === 'string' && typeof d.name === 'string');
}

