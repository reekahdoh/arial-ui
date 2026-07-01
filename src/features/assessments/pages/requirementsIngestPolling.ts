import { buildBackendAssessmentRequirementsFetchUrl, fetchBackendAssessmentRequirements } from '../../../services/assessments/backendAssessments';
import { parseRequirementsFileRecords, type RequirementsFileRecord } from '../../../services/assessments/backendRequirementsDocuments';
import type {
  AssessmentRiskExchangeLogEntry,
  AssessmentRiskRequestLog,
  AssessmentRiskResponseLog,
} from './assessingRiskAssessmentApi';
import { delay, isAbortError } from './assessmentPageShared';

export const REQUIREMENTS_INGEST_POLL_DELAY_MS = 10_000;
export const REQUIREMENTS_INGEST_WAITING_STATUS = 'Waiting for requirements to be processed';

export type RequirementsIngestPollSetters = {
  setExchangeLog: (update: (prev: AssessmentRiskExchangeLogEntry[]) => AssessmentRiskExchangeLogEntry[]) => void;
  setStatus: (status: string) => void;
};

function requirementsIngestPending(records: RequirementsFileRecord[]): boolean {
  return records.some((record) => {
    const status = record.status?.ingest_status?.trim();
    return status !== 'INITIALISED' && status !== 'READY';
  });
}

function requirementsNeedIngestWait(records: RequirementsFileRecord[]): boolean {
  return records.some((record) => record.status?.ingest_status?.trim() !== 'INITIALISED');
}

function throwIfAborted(signal: AbortSignal): void {
  if (signal.aborted) {
    throw new DOMException('The operation was aborted.', 'AbortError');
  }
}

function requirementsResponseLog(result: {
  ok: boolean;
  status: number;
  data: unknown;
  raw: string;
}): AssessmentRiskResponseLog {
  return {
    ok: result.ok,
    httpStatus: result.status,
    raw: result.raw,
    json: result.data ? JSON.stringify(result.data, null, 2) : null,
  };
}

function appendRequirementsPollLog(
  setExchangeLog: (update: (prev: AssessmentRiskExchangeLogEntry[]) => AssessmentRiskExchangeLogEntry[]) => void,
  entry: AssessmentRiskExchangeLogEntry,
): void {
  setExchangeLog((prev) => [...prev, entry]);
}

function updateRequirementsPollLog(
  setExchangeLog: (update: (prev: AssessmentRiskExchangeLogEntry[]) => AssessmentRiskExchangeLogEntry[]) => void,
  key: string,
  update: Partial<Pick<AssessmentRiskExchangeLogEntry, 'response' | 'error'>>,
): void {
  setExchangeLog((prev) => prev.map((entry) => (entry.key === key ? { ...entry, ...update } : entry)));
}

/** Poll GET /assessments/{id}/requirements until ingest completes before the first answer POST. */
export async function pollUntilRequirementsIngestReady(
  assessmentId: string,
  signal: AbortSignal,
  setters: RequirementsIngestPollSetters,
): Promise<void> {
  const { setExchangeLog, setStatus } = setters;
  const trimmedId = assessmentId.trim();
  const url = buildBackendAssessmentRequirementsFetchUrl(trimmedId);
  let pollCount = 0;

  while (true) {
    throwIfAborted(signal);
    pollCount += 1;

    const key = `${Date.now()}-requirements-${pollCount}`;
    const request: AssessmentRiskRequestLog = {
      method: 'GET',
      url,
      assessmentId: trimmedId,
      userId: '',
      message: '',
      bodySummary: '(none)',
    };
    appendRequirementsPollLog(setExchangeLog, { key, request, response: null, error: null });

    try {
      const result = await fetchBackendAssessmentRequirements(trimmedId, signal);
      updateRequirementsPollLog(setExchangeLog, key, { response: requirementsResponseLog(result) });

      if (result.ok) {
        const records = parseRequirementsFileRecords(result.data);
        if (records.length > 0) {
          if (!requirementsNeedIngestWait(records)) return;
          if (!requirementsIngestPending(records)) return;
        }
      }

      setStatus(REQUIREMENTS_INGEST_WAITING_STATUS);
    } catch (err) {
      if (isAbortError(err)) throw err;
      updateRequirementsPollLog(setExchangeLog, key, {
        error: err instanceof Error ? err.message : 'requirements request failed.',
      });
      setStatus(REQUIREMENTS_INGEST_WAITING_STATUS);
    }

    await delay(REQUIREMENTS_INGEST_POLL_DELAY_MS);
  }
}
