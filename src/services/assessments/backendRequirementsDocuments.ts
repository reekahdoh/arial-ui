import {
  buildBackendAssessmentRequirementsFetchUrl,
  fetchBackendAssessmentRequirements,
} from './backendAssessments';
import { backendFetch } from '../backendProxy';
import { getRiskAssessment } from './firestoreRiskAssessments';

export type RequirementsFileRecord = {
  user_id: string;
  parent_id: string;
  filepath: string;
  doc_id: string;
  status: {
    upload_status: string;
    ingest_status: string;
  };
};

function basenameFromPath(pathValue: string): string {
  const trimmed = pathValue.trim().replace(/[/\\]+$/, '');
  const parts = trimmed.split(/[/\\]/);
  return parts[parts.length - 1]?.trim() ?? '';
}

export function buildBackendRequirementsDocumentFileUrl(assessmentId: string, docId: string): string {
  return `${buildBackendAssessmentRequirementsFetchUrl(assessmentId)}/${encodeURIComponent(docId)}/file`;
}

function isRequirementsFileRecord(value: unknown): value is RequirementsFileRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as RequirementsFileRecord;
  return (
    typeof record.doc_id === 'string' &&
    typeof record.filepath === 'string' &&
    typeof record.parent_id === 'string'
  );
}

export function parseRequirementsFileRecords(data: unknown): RequirementsFileRecord[] {
  if (Array.isArray(data)) return data.filter(isRequirementsFileRecord);
  if (isRequirementsFileRecord(data)) return [data];
  return [];
}

function requirementsFileBasename(record: RequirementsFileRecord): string {
  return basenameFromPath(record.filepath) || record.filepath;
}

function pickRequirementsFileRecord(
  records: RequirementsFileRecord[],
  preferredFileName: string | null | undefined,
): RequirementsFileRecord {
  const preferred = preferredFileName?.trim().toLowerCase();
  if (preferred) {
    const match = records.find((record) => requirementsFileBasename(record).toLowerCase() === preferred);
    if (match) return match;
  }
  return records[records.length - 1];
}

async function loadStoredDocumentContent(
  assessmentId: string,
  preferredFileName: string | null | undefined,
): Promise<{ content: string; displayName: string } | null> {
  const remote = await getRiskAssessment(assessmentId.trim());
  const stored = remote?.customerContext?.documentContent?.trim();
  if (!stored) return null;

  const displayName = preferredFileName?.trim() || remote?.customerContext?.fileName?.trim() || 'Document';
  return { content: stored, displayName };
}

async function fetchDocumentContentFromApi(
  assessmentId: string,
  record: RequirementsFileRecord,
  signal?: AbortSignal,
): Promise<{ content: string; displayName: string }> {
  const fileUrl = buildBackendRequirementsDocumentFileUrl(assessmentId, record.doc_id);
  const fileRes = await backendFetch(fileUrl, {
    signal,
    headers: { Accept: 'text/plain, application/octet-stream, */*' },
  });

  if (!fileRes.ok) {
    return Promise.reject(new Error(`API_FILE_${fileRes.status}`));
  }

  const content = await fileRes.text();
  return {
    content: content || '(The uploaded file is empty.)',
    displayName: requirementsFileBasename(record),
  };
}

export async function loadAssessmentRequirementsRecords(
  assessmentId: string,
  signal?: AbortSignal,
): Promise<RequirementsFileRecord[]> {
  return fetchRequirementsFileRecords(assessmentId, signal);
}

async function fetchRequirementsFileRecords(
  assessmentId: string,
  signal?: AbortSignal,
): Promise<RequirementsFileRecord[]> {
  const trimmedId = assessmentId.trim();
  if (!trimmedId) throw new Error('Missing assessment id.');

  const listResult = await fetchBackendAssessmentRequirements(trimmedId, signal);
  if (!listResult.ok) {
    throw new Error(
      `GET /assessments/${trimmedId}/requirements returned ${listResult.status}: ${listResult.raw || '(empty response)'}`,
    );
  }

  const records = parseRequirementsFileRecords(listResult.data);
  if (!records.length) {
    throw new Error('No requirements document has been uploaded for this assessment yet.');
  }

  return records;
}

export async function fetchRequirementsDocumentContent(
  assessmentId: string,
  options?: { preferredFileName?: string | null; signal?: AbortSignal },
): Promise<{ content: string; displayName: string }> {
  const trimmedId = assessmentId.trim();
  if (!trimmedId) throw new Error('Missing assessment id.');

  const records = await fetchRequirementsFileRecords(trimmedId, options?.signal);
  const record = pickRequirementsFileRecord(records, options?.preferredFileName);

  try {
    return await fetchDocumentContentFromApi(trimmedId, record, options?.signal);
  } catch (err) {
    const stored = await loadStoredDocumentContent(trimmedId, options?.preferredFileName);
    if (stored) return stored;

    const apiStatus = err instanceof Error && err.message.startsWith('API_FILE_')
      ? err.message.replace('API_FILE_', '')
      : null;
    if (apiStatus === '404') {
      throw new Error(
        'The requirements file is stored on the server but cannot be downloaded yet. Open Project Requirements, re-select your document, and save again to enable viewing.',
      );
    }

    throw err instanceof Error ? err : new Error('Failed to load the requirements document.');
  }
}
