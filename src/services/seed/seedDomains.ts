import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { FIRESTORE_COLLECTION_DOMAINS } from '../../constants/firestoreCollections';
import type { Firestore } from 'firebase/firestore';

async function ensureDomain(db: Firestore, id: 'ai' | 'medical-device', name: 'AI' | 'Medical Device') {
  const ref = doc(db, FIRESTORE_COLLECTION_DOMAINS, id);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const existingName = snap.data()?.name;
    if (existingName === name) return;
    await setDoc(ref, { name, updatedAt: serverTimestamp() }, { merge: true });
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
  await ensureDomain(db, 'medical-device', 'Medical Device');
}

