import { isUsingFirebaseEmulators } from '../services/firebase';

export function timeoutErrorMessage(label: string, timeoutMs: number): string {
  const seconds = Math.round(timeoutMs / 1000);
  if (isUsingFirebaseEmulators()) {
    return `${label} timed out after ${seconds}s. Check that the Firestore emulator is running (npm run emulators).`;
  }
  return `${label} timed out after ${seconds}s. Please try again.`;
}

export function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(timeoutErrorMessage(label, timeoutMs)));
    }, timeoutMs);
    void promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (err: unknown) => {
        window.clearTimeout(timer);
        reject(err);
      },
    );
  });
}
