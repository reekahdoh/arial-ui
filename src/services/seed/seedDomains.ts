import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { FIRESTORE_COLLECTION_DOMAINS } from '../../constants/firestoreCollections';
import type { Firestore } from 'firebase/firestore';

async function ensureDomain(db: Firestore, id: 'ai' | 'who', name: 'AI' | 'WHO') {
  const ref = doc(db, FIRESTORE_COLLECTION_DOMAINS, id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return;
  }
  await setDoc(
    ref,
    {
      name,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function seedDomainsIfMissing(db: Firestore): Promise<void> {
  await ensureDomain(db, 'ai', 'AI');
  await ensureDomain(db, 'who', 'WHO');
}

