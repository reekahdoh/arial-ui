import { backendFetch, buildBackendProxyUrl } from '../backendProxy';

export interface CreateBackendAssessmentInput {
  userId: string;
  name: string;
  description: string;
}

export interface CreateBackendAssessmentResult {
  ok: boolean;
  status: number;
  data: unknown;
  raw: string;
}

/** Collection URL ends with `/` to avoid slash-redirect issues on some gateways. */
function getBackendAssessmentsBaseUrl(): string {
  return buildBackendProxyUrl('/assessments/');
}

export function buildBackendAssessmentUrl(assessmentId: string): string {
  return `${getBackendAssessmentsBaseUrl()}${encodeURIComponent(assessmentId)}`;
}

export function buildBackendAssessmentReportUrl(assessmentId: string, userId: string): string {
  const params = new URLSearchParams();
  params.set('user_id', userId);
  return `${buildBackendAssessmentUrl(assessmentId.trim())}/report?${params.toString()}`;
}

async function parseBackendAssessmentResponse(res: Response): Promise<FetchBackendAssessmentResult> {
  const raw = (await res.text()).trim();
  if (!raw) {
    return { ok: res.ok, status: res.status, data: null, raw };
  }

  try {
    return { ok: res.ok, status: res.status, data: JSON.parse(raw), raw };
  } catch {
    return { ok: res.ok, status: res.status, data: null, raw };
  }
}

export function buildCreateBackendAssessmentUrl(input: CreateBackendAssessmentInput): string {
  const params = new URLSearchParams();
  params.set('user_id', input.userId);
  params.set('name', input.name);
  params.set('description', input.description);

  return `${getBackendAssessmentsBaseUrl()}?${params.toString()}`;
}

export interface PutBackendAssessmentRequirementsInput {
  userId: string;
  name: string;
  description: string;
  file: File;
}

export function buildBackendAssessmentRequirementsFetchUrl(assessmentId: string): string {
  return `${buildBackendAssessmentUrl(assessmentId.trim())}/requirements`;
}

export function buildAssessmentRequirementsUrl(
  assessmentId: string,
  input: Pick<PutBackendAssessmentRequirementsInput, 'userId' | 'name' | 'description'>,
): string {
  const params = new URLSearchParams();
  params.set('user_id', input.userId);
  params.set('name', input.name);
  params.set('description', input.description);
  return `${buildBackendAssessmentRequirementsFetchUrl(assessmentId)}?${params.toString()}`;
}

function basenameFromPath(path: string): string {
  const trimmed = path.trim().replace(/[/\\]+$/, '');
  const parts = trimmed.split(/[/\\]/);
  const last = parts[parts.length - 1]?.trim() ?? '';
  return last;
}

function requirementsPathFromUnknown(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (!value || typeof value !== 'object') return null;

  const record = value as Record<string, unknown>;
  const keys = [
    'requirements',
    'requirements_file',
    'requirements_file_path',
    'requirements_path',
    'file',
    'file_path',
    'path',
    'url',
    'name',
    'filename',
    'file_name',
  ] as const;

  for (const key of keys) {
    const candidate = requirementsPathFromUnknown(record[key]);
    if (candidate) return candidate;
  }

  for (const key of ['data', 'result', 'assessment'] as const) {
    const nested = requirementsPathFromUnknown(record[key]);
    if (nested) return nested;
  }

  return null;
}

/** Extract display filename from GET /assessments/{id}/requirements response. */
export function requirementsDocumentFileName(data: unknown, raw: string): string | null {
  const fromData = requirementsPathFromUnknown(data);
  if (fromData) {
    const basename = basenameFromPath(fromData);
    if (basename) return basename;
  }

  const trimmedRaw = raw.trim();
  if (!trimmedRaw) return null;

  try {
    const parsed: unknown = JSON.parse(trimmedRaw);
    const fromParsed = requirementsPathFromUnknown(parsed);
    if (fromParsed) {
      const basename = basenameFromPath(fromParsed);
      if (basename) return basename;
    }
  } catch {
    // plain string path
  }

  const basename = basenameFromPath(trimmedRaw.replace(/^"|"$/g, ''));
  return basename || null;
}

export interface FetchBackendAssessmentResult {
  ok: boolean;
  status: number;
  data: unknown;
  raw: string;
}

export interface GenerateBackendAssessmentReportInput {
  userId: string;
}

export async function fetchBackendAssessmentById(
  assessmentId: string,
  signal?: AbortSignal,
): Promise<FetchBackendAssessmentResult> {
  const url = buildBackendAssessmentUrl(assessmentId.trim());
  const res = await backendFetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json, text/plain, */*' },
    signal,
  });

  return parseBackendAssessmentResponse(res);
}

export async function fetchBackendAssessmentRequirements(
  assessmentId: string,
  signal?: AbortSignal,
): Promise<FetchBackendAssessmentResult> {
  const url = buildBackendAssessmentRequirementsFetchUrl(assessmentId);
  const res = await backendFetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json, text/plain, */*' },
    signal,
  });

  return parseBackendAssessmentResponse(res);
}

export async function fetchBackendAssessmentReport(
  assessmentId: string,
  input: GenerateBackendAssessmentReportInput,
  signal?: AbortSignal,
): Promise<FetchBackendAssessmentResult> {
  const url = buildBackendAssessmentReportUrl(assessmentId, input.userId);
  const res = await backendFetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json, text/plain, */*' },
    signal,
  });

  return parseBackendAssessmentResponse(res);
}

export async function generateBackendAssessmentReport(
  assessmentId: string,
  input: GenerateBackendAssessmentReportInput,
  signal?: AbortSignal,
): Promise<FetchBackendAssessmentResult> {
  const url = buildBackendAssessmentReportUrl(assessmentId, input.userId);
  const res = await backendFetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_id: input.userId }),
    signal,
  });

  return parseBackendAssessmentResponse(res);
}

export async function createBackendAssessment(
  input: CreateBackendAssessmentInput,
  signal?: AbortSignal,
): Promise<CreateBackendAssessmentResult> {
  const url = buildCreateBackendAssessmentUrl(input);
  const res = await backendFetch(url, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: '',
    signal,
  });

  const raw = (await res.text()).trim();
  if (!raw) {
    return { ok: res.ok, status: res.status, data: null, raw };
  }

  try {
    return { ok: res.ok, status: res.status, data: JSON.parse(raw), raw };
  } catch {
    return { ok: res.ok, status: res.status, data: null, raw };
  }
}

export async function putBackendAssessmentRequirements(
  assessmentId: string,
  input: PutBackendAssessmentRequirementsInput,
  signal?: AbortSignal,
): Promise<CreateBackendAssessmentResult> {
  const url = buildAssessmentRequirementsUrl(assessmentId, input);
  const body = new FormData();
  body.set('file', input.file, input.file.name);
  const res = await backendFetch(url, {
    method: 'PUT',
    headers: { Accept: 'application/json' },
    body,
    signal,
  });

  const raw = (await res.text()).trim();
  if (!raw) {
    return { ok: res.ok, status: res.status, data: null, raw };
  }

  try {
    return { ok: res.ok, status: res.status, data: JSON.parse(raw), raw };
  } catch {
    return { ok: res.ok, status: res.status, data: null, raw };
  }
}
