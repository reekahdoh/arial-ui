export interface CreateBackendAssessmentInput {
  userId: string;
  name: string;
  description: string;
  requirement: string;
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

export function buildCreateBackendAssessmentUrl(input: CreateBackendAssessmentInput): string {
  const params = new URLSearchParams();
  params.set('user_id', input.userId);
  params.set('name', input.name);
  params.set('description', input.description);
  params.set('requirement', input.requirement);

  return `${getBackendAssessmentsBaseUrl()}?${params.toString()}`;
}

export interface FetchBackendAssessmentResult {
  ok: boolean;
  status: number;
  data: unknown;
  raw: string;
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
