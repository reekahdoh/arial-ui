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

function getBackendAssessmentsBaseUrl(): string {
  return 'http://34.39.37.147:8080/assessments';
}

export function buildBackendAssessmentUrl(assessmentId: string): string {
  return `${getBackendAssessmentsBaseUrl()}/${encodeURIComponent(assessmentId)}`;
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

export function buildAssessmentRequirementsUrl(
  assessmentId: string,
  input: Pick<PutBackendAssessmentRequirementsInput, 'userId' | 'name' | 'description'>,
): string {
  const params = new URLSearchParams();
  params.set('user_id', input.userId);
  params.set('name', input.name);
  params.set('description', input.description);
  return `${buildBackendAssessmentUrl(assessmentId.trim())}/requirements?${params.toString()}`;
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
  const res = await fetch(url, {
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
  const res = await fetch(url, {
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
  const res = await fetch(url, {
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
  const res = await fetch(url, {
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
  const res = await fetch(url, {
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
