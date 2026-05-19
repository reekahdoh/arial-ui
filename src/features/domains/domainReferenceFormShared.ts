import type { ReferenceKind } from './domainReferencesStorage';

export type DomainKey = 'ai' | 'who';

export const referenceTypePillSx = {
  flex: 1,
  minWidth: 0,
  py: 1.25,
  px: 2,
  borderRadius: 9999,
  textTransform: 'none',
  fontWeight: 600,
} as const;

export function isDomainKey(value: unknown): value is DomainKey {
  return value === 'ai' || value === 'who';
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function formatFileValue(file: File): string {
  const kb = Math.max(1, Math.round(file.size / 1024));
  const type = file.type ? file.type : 'unknown type';
  return `${file.name} (${type}, ${kb} KB)`;
}

export function canSaveDomainReference(
  isReady: boolean,
  kind: ReferenceKind,
  url: string,
  file: File | null,
): boolean {
  if (!isReady) return false;
  if (kind === 'website') return isValidHttpUrl(url.trim());
  return !!file;
}

export function domainReferenceValue(kind: ReferenceKind, url: string, file: File | null): string {
  if (kind === 'website') return url.trim();
  return file ? formatFileValue(file) : '';
}
