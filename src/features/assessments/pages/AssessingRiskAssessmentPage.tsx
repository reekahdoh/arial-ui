import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  LinearProgress,
  TextField,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { AppCard } from '../../../components/ui/AppCard';
import { PageHeader } from '../../../components/ui/PageHeader';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

type AssessmentRiskJson = {
  chat_id?: string;
  message?: string;
  history?: { role: string; content: string }[];
  chat_stage?: string;
  turn_type?: string;
  complete?: boolean;
  progress?: unknown;
  progress_percentage?: unknown;
  percentage?: unknown;
};

type AssessmentRiskResult = {
  ok: boolean;
  status: number;
  data: AssessmentRiskJson | null;
  raw: string;
};

type LocationState = {
  assessmentId?: unknown;
};

type RiskReportPayload = {
  assessmentId: string;
  completedAt: string;
  response: AssessmentRiskJson | null;
  raw: string;
};

type AssessmentRiskRequestLog = {
  method: string;
  url: string;
  assessmentId: string;
  userId: string;
  message: string;
  bodySummary: string;
};

type AssessmentRiskResponseLog = {
  ok: boolean;
  httpStatus: number;
  raw: string;
  json: string | null;
};

type AssessmentRiskExchangeLogEntry = {
  key: string;
  request: AssessmentRiskRequestLog;
  response: AssessmentRiskResponseLog | null;
  error: string | null;
};

function stringFromUnknown(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number') return String(value);
  return null;
}

function progressPercentFromValue(value: unknown): number | null {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number.parseFloat(value.replace('%', '').trim())
        : Number.NaN;

  if (!Number.isFinite(parsed)) return null;
  return Math.min(100, Math.max(0, (parsed - 50) * 2));
}

function progressPercentFromResponse(data: AssessmentRiskJson | null): number | null {
  if (!data) return null;
  return (
    progressPercentFromValue(data.progress) ??
    progressPercentFromValue(data.progress_percentage) ??
    progressPercentFromValue(data.percentage)
  );
}

function getAssessmentRiskBaseUrl(assessmentId: string): string {
  const encodedAssessmentId = encodeURIComponent(assessmentId);
  return `http://34.39.37.147:8080/assessments/${encodedAssessmentId}/risk`;
}

function buildAssessmentRiskRequestUrl(assessmentId: string, userId: string, message: string) {
  const params = new URLSearchParams();
  params.set('user_id', userId);
  params.set('message', message);
  const base = getAssessmentRiskBaseUrl(assessmentId);
  return `${base}?${params.toString()}`;
}

function buildAssessmentRiskRequestBody(userId: string, message: string) {
  return {
    user_id: userId,
    message,
  };
}

async function postAssessmentRisk(
  url: string,
  signal: AbortSignal,
  body: { user_id: string; message: string },
): Promise<AssessmentRiskResult> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal,
  });

  const raw = (await res.text()).trim();
  if (!raw) {
    return { ok: res.ok, status: res.status, data: null, raw };
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return { ok: res.ok, status: res.status, data: parsed as AssessmentRiskJson, raw };
    }
    return { ok: res.ok, status: res.status, data: null, raw };
  } catch {
    return { ok: res.ok, status: res.status, data: null, raw };
  }
}

async function postAssessmentRiskWithBetterNetworkError(
  url: string,
  signal: AbortSignal,
  body: { user_id: string; message: string },
) {
  try {
    return await postAssessmentRisk(url, signal, body);
  } catch (err) {
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      throw new Error(
        `Failed to fetch "${url}" (network/CORS). In dev, ensure the proxy is running and restart npm start after proxy changes.`,
      );
    }
    throw err;
  }
}

function normalizeResponseMessage(message: string | null | undefined): string {
  return typeof message === 'string' ? message.trim().toUpperCase() : '';
}

function isRiskComplete(data: AssessmentRiskJson | null, raw: string): boolean {
  if (normalizeResponseMessage(data?.message) === 'COMPLETED') return true;
  if (data?.complete === true) return true;

  const text = raw.trim().replace(/^"|"$/g, '').toUpperCase();
  return text === 'COMPLETED';
}

function getRiskPrompt(data: AssessmentRiskJson | null, raw: string): string | null {
  if (isRiskComplete(data, raw)) return null;

  const message = data?.message;
  if (typeof message === 'string' && message.trim() !== '') {
    return message.trim();
  }

  const text = raw.trim().replace(/^"|"$/g, '');
  return text ? text : null;
}

function getRiskReportStorageKey(assessmentId: string): string {
  return `risk-report:${assessmentId}`;
}

export function AssessingRiskAssessmentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const locationState = location.state as LocationState | null;
  const assessmentId =
    stringFromUnknown(locationState?.assessmentId) ?? searchParams.get('assessmentId')?.trim() ?? '';

  const [status, setStatus] = useState('Starting risk assessment...');
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isFirstResponseReady, setIsFirstResponseReady] = useState(false);
  const [riskReport, setRiskReport] = useState<RiskReportPayload | null>(null);
  const [progressPercent, setProgressPercent] = useState<number | null>(null);
  const [riskExchangeLog, setRiskExchangeLog] = useState<AssessmentRiskExchangeLogEntry[]>([]);

  const initialRiskStartedRef = useRef(false);

  const sendRiskAnswer = useCallback(async (message: string, signal: AbortSignal) => {
    const trimmedAssessmentId = assessmentId.trim();
    if (!trimmedAssessmentId) {
      throw new Error('Cannot assess risk: missing assessment id.');
    }
    if (!user) {
      throw new Error('Cannot assess risk: missing authenticated user.');
    }

    const userId = user.uid;
    const requestBody = buildAssessmentRiskRequestBody(userId, message);
    const url = buildAssessmentRiskRequestUrl(trimmedAssessmentId, userId, message);
    const key = `${Date.now()}-${message.length}`;
    const request: AssessmentRiskRequestLog = {
      method: 'POST',
      url,
      assessmentId: trimmedAssessmentId,
      userId,
      message,
      bodySummary: JSON.stringify(requestBody, null, 2),
    };

    setRiskExchangeLog((prev) => [
      ...prev,
      { key, request, response: null, error: null },
    ]);

    let result: AssessmentRiskResult;
    try {
      result = await postAssessmentRiskWithBetterNetworkError(url, signal, requestBody);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setRiskExchangeLog((prev) => prev.filter((entry) => entry.key !== key));
      } else {
        setRiskExchangeLog((prev) =>
          prev.map((entry) =>
            entry.key === key
              ? {
                  ...entry,
                  error: err instanceof Error ? err.message : 'assessment risk request failed.',
                }
              : entry,
          ),
        );
      }
      throw err;
    }

    const { ok, status: httpStatus, data, raw } = result;
    setRiskExchangeLog((prev) =>
      prev.map((entry) =>
        entry.key === key
          ? {
              ...entry,
              response: {
                ok,
                httpStatus,
                raw,
                json: data ? JSON.stringify(data, null, 2) : null,
              },
            }
          : entry,
      ),
    );

    if (!ok) {
      throw new Error(`assessment risk returned ${httpStatus}: ${raw || '(empty response)'}`);
    }

    setProgressPercent(progressPercentFromResponse(data));

    if (isRiskComplete(data, raw)) {
      const report = {
        assessmentId: trimmedAssessmentId,
        completedAt: new Date().toISOString(),
        response: data,
        raw,
      };
      sessionStorage.setItem(getRiskReportStorageKey(trimmedAssessmentId), JSON.stringify(report));
      setRiskReport(report);
      setQuestion(null);
      setProgressPercent(progressPercentFromResponse(data) ?? 100);
      setStatus('Risk assessment complete.');
      setIsComplete(true);
      return;
    }

    const nextQuestion = getRiskPrompt(data, raw);
    setQuestion(nextQuestion);
    setStatus('');
  }, [assessmentId, user]);

  useEffect(() => {
    if (initialRiskStartedRef.current) return;
    initialRiskStartedRef.current = true;

    const controller = new AbortController();
    void (async () => {
      try {
        setStatus('Working to understand the level of risk...');
        await sendRiskAnswer('', controller.signal);
        setIsFirstResponseReady(true);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          initialRiskStartedRef.current = false;
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to assess risk.');
      }
    })();

    return () => {
      initialRiskStartedRef.current = false;
      controller.abort();
    };
  }, [sendRiskAnswer]);

  async function submitAnswer() {
    const trimmed = answer.trim();
    if (!trimmed) return;
    if (isSubmittingAnswer) return;
    if (error || isComplete) return;

    const controller = new AbortController();
    setIsSubmittingAnswer(true);
    setStatus(
      "Please be patient while we process your response.\n\nWe're looking to fully underdstand your requirements and the risks involved in using AI to meet those requirements.\n\nThis may take a few minutes.",
    );
    try {
      await sendRiskAnswer(trimmed, controller.signal);
      setAnswer('');
      setIsFirstResponseReady(true);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to submit answer.');
    } finally {
      setIsSubmittingAnswer(false);
    }
  }

  function openRiskReport() {
    if (!riskReport) return;
    const reportPath = `/assessments/risk-report?assessmentId=${encodeURIComponent(riskReport.assessmentId)}`;
    navigate(reportPath, {
      state: {
        assessmentId: riskReport.assessmentId,
        report: riskReport,
      },
    });
  }

  const showDiagnostics = Boolean(assessmentId.trim()) || riskExchangeLog.length > 0;

  const diagnosticsAccordion = (
    <Accordion
      defaultExpanded={false}
      disableGutters
      sx={{
        width: '100%',
        '&:before': { display: 'none' },
        boxShadow: 'none',
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          px: 2,
          minHeight: 48,
          position: 'relative',
          '& .MuiAccordionSummary-content': {
            flexGrow: 1,
            justifyContent: 'center',
            margin: 0,
          },
          '& .MuiAccordionSummary-expandIconWrapper': {
            position: 'absolute',
            right: 8,
            top: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
          },
        }}
      >
        <Typography variant="subtitle2" component="span">
          Diagnostics
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 2, pt: 0, pb: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {assessmentId ? (
            <Box
              sx={{
                width: '100%',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                px: 2,
                py: 1.25,
                bgcolor: 'surface.inset',
              }}
            >
              <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>
                Assessment ID
              </Typography>
              <Typography variant="data" sx={{ wordBreak: 'break-all' }}>
                {assessmentId}
              </Typography>
            </Box>
          ) : null}

          {riskExchangeLog.length > 0 ? (
            <Box
              sx={{
                width: '100%',
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'action.hover',
              }}
            >
              <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                assessment risk requests and responses
              </Typography>
              {riskExchangeLog.map((entry, index, arr) => (
                <Box key={entry.key} sx={{ mb: index === arr.length - 1 ? 0 : 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    {entry.response
                      ? `Request ${index + 1} · HTTP ${entry.response.httpStatus}${entry.response.ok ? '' : ' (error)'}`
                      : entry.error
                        ? `Request ${index + 1} · failed`
                        : `Request ${index + 1} · awaiting response`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, mb: 0.25 }}>
                    POST URL (browser fetch target — proxy must forward here for the risk API)
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    component="pre"
                    sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', m: 0, mb: 1, wordBreak: 'break-all' }}
                  >
                    {entry.request.url}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, mb: 0.25 }}>
                    Request body (JSON POST body)
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    component="pre"
                    sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', m: 0, mb: 1, wordBreak: 'break-word' }}
                  >
                    {entry.request.bodySummary}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, mb: 0.25 }}>
                    Response JSON
                  </Typography>
                  {entry.response ? (
                    <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', m: 0 }}>
                      {entry.response.json || entry.response.raw || '(empty body)'}
                    </Typography>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      Waiting for response...
                    </Typography>
                  )}
                  {entry.error ? (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      {entry.error}
                    </Alert>
                  ) : null}
                </Box>
              ))}
            </Box>
          ) : (
            <Typography variant="caption" color="text.secondary">
              API request/response details will appear here after the assessment service responds.
            </Typography>
          )}
        </Box>
      </AccordionDetails>
    </Accordion>
  );

  return (
    <>
      <PageHeader
        title="Assessing Risk"
        description="Working to understand the level of risk in the system you are procuring or building."
        descriptionVariant="body1"
        descriptionSx={{ fontSize: '1rem', lineHeight: 1.45 }}
      />
      <AppCard>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 4 }}>
          {error ? (
            <Alert severity="error" sx={{ width: '100%', maxWidth: 520 }}>
              {error}
            </Alert>
          ) : null}
          {error || status.trim() !== '' ? (
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
              {error ? 'Stopped.' : status}
            </Typography>
          ) : null}

          {!error && isComplete ? (
            <Button
              size="large"
              variant="contained"
              onClick={openRiskReport}
              disabled={!riskReport}
              sx={{ mt: 1, px: 4, py: 1.5, borderRadius: 999 }}
            >
              Read The Report
            </Button>
          ) : null}

          {!error && isFirstResponseReady && !isComplete && !isSubmittingAnswer ? (
            <Box sx={{ width: '100%', maxWidth: 720, mt: 1 }}>
              {progressPercent !== null ? (
                <Box sx={{ width: '100%', mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                    <Typography variant="overline" color="text.secondary">
                      Progress
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {Math.round(progressPercent)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={progressPercent}
                    aria-label="Risk assessment progress"
                    sx={{ height: 8, borderRadius: 999 }}
                  />
                </Box>
              ) : null}
              {question ? (
                <Box
                  sx={{
                    mb: 2,
                    width: '100%',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    px: 2,
                    py: 1.75,
                    backgroundColor: 'background.paper',
                  }}
                >
                  <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                    Question
                  </Typography>
                  <Typography variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.55 }}>
                    {question}
                  </Typography>
                </Box>
              ) : null}

              <TextField
                fullWidth
                multiline
                minRows={5}
                label="Your answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={isSubmittingAnswer}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return;
                  if (e.shiftKey) return; // allow newline
                  e.preventDefault(); // submit on Enter
                  void submitAnswer();
                }}
              />
              <Button
                variant="contained"
                onClick={() => void submitAnswer()}
                disabled={!answer.trim() || isSubmittingAnswer}
                sx={{ mt: 1.5, width: '100%' }}
              >
                Provide Answer
              </Button>
            </Box>
          ) : null}
        </Box>
      </AppCard>
      {showDiagnostics ? (
        <AppCard sx={{ mt: 2 }}>
          <Box sx={{ width: '100%', maxWidth: 720, mx: 'auto' }}>{diagnosticsAccordion}</Box>
        </AppCard>
      ) : null}
    </>
  );
}
