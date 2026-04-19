import type { Timestamp } from 'firebase/firestore';

/** Firestore `userProfiles/{uid}` — document-shaped profile (extends Auth email). */
export interface UserProfile {
  email: string;
  loginName: string;
  createdAt: Timestamp;
}
