import { useLocation, useSearchParams } from 'react-router-dom';

type LocationState = {
  assessmentId?: unknown;
};

export function stringFromUnknown(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number') return String(value);
  return null;
}

export function useAssessmentIdFromRoute(): string {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const locationState = location.state as LocationState | null;
  return stringFromUnknown(locationState?.assessmentId) ?? searchParams.get('assessmentId')?.trim() ?? '';
}

export function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError';
}

export function formatFetchNetworkError(): string {
  return 'Could not reach the API (network or CORS).';
}

export function mapThrownError(err: unknown, fallback: string): string {
  if (isAbortError(err)) return '';
  if (err instanceof TypeError && err.message === 'Failed to fetch') return formatFetchNetworkError();
  return err instanceof Error ? err.message : fallback;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function parseProgressValue(value: unknown): number | null {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number.parseFloat(value.replace('%', '').trim())
        : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

export function progressPercentFromFields(
  fields: { progress?: unknown; progress_percentage?: unknown; percentage?: unknown },
  transform: (parsed: number) => number,
): number | null {
  const parsed =
    parseProgressValue(fields.progress) ??
    parseProgressValue(fields.progress_percentage) ??
    parseProgressValue(fields.percentage);
  if (parsed === null) return null;
  return Math.min(100, Math.max(0, transform(parsed)));
}
