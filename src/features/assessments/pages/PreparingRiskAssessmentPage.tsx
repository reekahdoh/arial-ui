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
import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { resolveAuthenticatedUsername } from '../../../services/auth/resolveAuthenticatedUsername';

function getAssessmentAiBaseUrl(assessmentId: string): string {
  const encodedAssessmentId = encodeURIComponent(assessmentId);
  return `http://34.39.37.147:8080/assessments/${encodedAssessmentId}/ai`;
}

type AssessmentAiJson = {
  chat_id: string;
  message: string;
  history: { role: string; content: string }[];
  chat_stage: string;
  turn_type: string;
  progress?: unknown;
  progress_percentage?: unknown;
  percentage?: unknown;
};

function buildAssessmentAiRequestUrl(assessmentId: string, userId: string, message?: string) {
  const params = new URLSearchParams();
  params.set('user_id', userId);
  params.set('message', message ?? '');
  const base = getAssessmentAiBaseUrl(assessmentId);
  return `${base}?${params.toString()}`;
}

function buildAssessmentAiRequestBody(userId: string, message?: string) {
  return {
    user_id: userId,
    message: message ?? '',
  };
}

async function postAssessmentAiJson(
  url: string,
  signal: AbortSignal,
  options: { userId: string; message?: string },
): Promise<{ ok: boolean; status: number; data: AssessmentAiJson | null; raw: string }> {
  const { userId, message } = options;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildAssessmentAiRequestBody(userId, message)),
    signal,
  });

  const raw = (await res.text()).trim();
  if (!raw) {
    return { ok: res.ok, status: res.status, data: null, raw };
  }
  try {
    const data = JSON.parse(raw) as AssessmentAiJson;
    return { ok: res.ok, status: res.status, data, raw };
  } catch {
    return { ok: res.ok, status: res.status, data: null, raw };
  }
}

const IDENTIFYING_STAGE = 'identifying-ais';
const IDENTIFIED_STAGE = 'identified-ais';
const REQUIREMENTS_POLL_DELAY_MS = 3000;
const ANSWER_PROCESSING_STATUS =
  "Thanks. Please be patient - there's a lot to do here.\n\nWe’re reviewing your response, and your requirements within the specified domain, to identify where AI can be used to meet your needs.";

function normalizeChatStage(stage: string | null | undefined): string {
  return typeof stage === 'string' ? stage.trim().toLowerCase() : '';
}

function isIdentifiedStage(stage: string | null | undefined): boolean {
  return normalizeChatStage(stage) === IDENTIFIED_STAGE;
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function isRequirementsProcessingResponse(status: number, raw: string): boolean {
  return status === 417 && raw.toLowerCase().includes('requirements still being processed');
}

type AiIdResponseLogEntry = {
  key: string;
  chatStage: string;
  httpStatus: number;
  requestUrl: string;
  requestBodyJson: string;
  responseJson: string;
};

type LocationState = {
  assessmentId?: unknown;
};

function stringFromUnknown(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number') return String(value);
  return null;
}

function progressPercentFromScore(value: unknown): number | null {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number.parseFloat(value.replace('%', '').trim())
        : Number.NaN;

  if (!Number.isFinite(parsed)) return null;
  return Math.min(100, Math.max(0, parsed * 2));
}

function progressPercentFromResponse(data: AssessmentAiJson): number | null {
  return (
    progressPercentFromScore(data.progress) ??
    progressPercentFromScore(data.progress_percentage) ??
    progressPercentFromScore(data.percentage)
  );
}

export function PreparingRiskAssessmentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const locationState = location.state as LocationState | null;
  const assessmentId =
    stringFromUnknown(locationState?.assessmentId) ?? searchParams.get('assessmentId')?.trim() ?? '';
  const [status, setStatus] = useState('Starting…');
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [aiStage, setAiStage] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [progressPercent, setProgressPercent] = useState<number | null>(null);
  const [isFirstResponseReady, setIsFirstResponseReady] = useState(false);
  const [aiIdResponseLog, setAiIdResponseLog] = useState<AiIdResponseLogEntry[]>([]);

  const appendAiIdLog = (entry: Omit<AiIdResponseLogEntry, 'key'>) => {
    setAiIdResponseLog((prev) => [
      ...prev,
      { ...entry, key: `${Date.now()}-${prev.length}` },
    ]);
  };

  const moveToAssessingRisk = useCallback((chatIdForRisk: string) => {
    const trimmed = chatIdForRisk.trim();
    if (!trimmed) {
      setError('Cannot assess risk: ai-id did not return a chat_id.');
      return;
    }
    if (!assessmentId) {
      setError('Cannot assess risk: missing assessment id.');
      return;
    }
    navigate(
      `/assessments/assessing-risk?assessmentId=${encodeURIComponent(assessmentId)}`,
      {
        state: { assessmentId, chatId: trimmed },
      },
    );
  }, [assessmentId, navigate]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    void (async () => {
      try {
        if (!assessmentId) {
          throw new Error('Cannot identify AIs: missing assessment id.');
        }
        if (!user) {
          throw new Error('Cannot identify AIs: missing authenticated user.');
        }

        setStatus('Please wait whilst we prepare the materials...');
        const userId = await resolveAuthenticatedUsername(user);
        if (cancelled) return;

        const url = buildAssessmentAiRequestUrl(assessmentId, userId);
        let response = await postAssessmentAiJson(url, controller.signal, { userId });
        while (!cancelled && !response.ok && isRequirementsProcessingResponse(response.status, response.raw)) {
          setStatus('Requirements are still being processed. Please wait...');
          await delay(REQUIREMENTS_POLL_DELAY_MS);
          if (cancelled) return;
          response = await postAssessmentAiJson(url, controller.signal, { userId });
        }
        if (cancelled) return;
        const { ok, status: httpStatus, data, raw } = response;
        if (!ok) {
          throw new Error(`assessment ai returned ${httpStatus}: ${raw || '(empty response)'}`);
        }
        if (!data) {
          throw new Error(`assessment ai returned non-JSON: ${raw || '(empty response)'}`);
        }

        console.log('[assessment-ai] response', {
          requestUrl: url,
          httpStatus,
          chat_stage: data.chat_stage,
          body: data,
        });
        appendAiIdLog({
          chatStage: data.chat_stage,
          httpStatus,
          requestUrl: url,
          requestBodyJson: JSON.stringify(buildAssessmentAiRequestBody(userId), null, 2),
          responseJson: JSON.stringify(data, null, 2),
        });

        setAiStage(data.chat_stage);
        setQuestion(data.message || null);
        setProgressPercent(progressPercentFromResponse(data));
        const resolvedChatId =
          typeof data.chat_id === 'string' && data.chat_id.trim() !== ''
            ? data.chat_id.trim()
            : null;
        setChatId(resolvedChatId);
        setIsFirstResponseReady(true);
        setStatus('');
      } catch (err) {
        if (cancelled) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (err instanceof TypeError && err.message === 'Failed to fetch') {
          setError(
            'Could not reach the API (network or CORS).',
          );
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to run risk assessment.');
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [assessmentId, user]);

  async function submitAnswer() {
    const trimmed = answer.trim();
    if (!trimmed) return;
    if (isSubmittingAnswer) return;
    if (error) return;
    if (isIdentifiedStage(aiStage)) return;

    if (!assessmentId) {
      setError('Cannot send your answer: missing assessment id.');
      return;
    }
    if (!user) {
      setError('Cannot send your answer: missing authenticated user.');
      return;
    }

    setIsSubmittingAnswer(true);
    setStatus(ANSWER_PROCESSING_STATUS);
    try {
      const controller = new AbortController();
      const userId = await resolveAuthenticatedUsername(user);
      const url = buildAssessmentAiRequestUrl(assessmentId, userId, trimmed);
      const { ok, status: httpStatus, data, raw } = await postAssessmentAiJson(
        url,
        controller.signal,
        { userId, message: trimmed },
      );
      if (!ok) {
        throw new Error(`assessment ai returned ${httpStatus}: ${raw || '(empty response)'}`);
      }
      if (!data) {
        throw new Error(`assessment ai returned non-JSON: ${raw || '(empty response)'}`);
      }

      console.log('[assessment-ai] response', {
        requestUrl: url,
        httpStatus,
        chat_stage: data.chat_stage,
        body: data,
      });
      appendAiIdLog({
        chatStage: data.chat_stage,
        httpStatus,
        requestUrl: url,
        requestBodyJson: JSON.stringify(buildAssessmentAiRequestBody(userId, trimmed), null, 2),
        responseJson: JSON.stringify(data, null, 2),
      });

      setAiStage(data.chat_stage);
      setQuestion(data.message || null);
      setProgressPercent(progressPercentFromResponse(data));
      setAnswer('');
      setChatId((prev) => {
        if (prev && prev.trim() !== '') return prev;
        const next =
          typeof data.chat_id === 'string' && data.chat_id.trim() !== ''
            ? data.chat_id.trim()
            : null;
        return next;
      });

      if (isIdentifiedStage(data.chat_stage)) {
        setStatus('');
      } else if (normalizeChatStage(data.chat_stage) === IDENTIFYING_STAGE) {
        setStatus('');
      } else {
        // Unexpected intermediate stage; still keep the UI interactive.
        setStatus(`Stage: ${data.chat_stage}`);
      }
    } catch (err) {
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        setError(
          'Could not reach the API (network or CORS).',
        );
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to submit answer.');
    } finally {
      setIsSubmittingAnswer(false);
    }
  }

  const showDiagnostics = Boolean(assessmentId.trim()) || aiIdResponseLog.length > 0;

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

          {aiIdResponseLog.length > 0 ? (
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
                assessment ai responses (identifying-ais / identified-ais)
              </Typography>
              {aiIdResponseLog.map((entry, index, arr) => (
                <Box key={entry.key} sx={{ mb: index === arr.length - 1 ? 0 : 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    chat_stage: {entry.chatStage} · HTTP {entry.httpStatus}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, mb: 0.25 }}>
                    POST URL (browser fetch target — proxy must forward here for the AI API)
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    component="pre"
                    sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', m: 0, mb: 1, wordBreak: 'break-all' }}
                  >
                    {entry.requestUrl}
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
                    {entry.requestBodyJson}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, mb: 0.25 }}>
                    Response JSON
                  </Typography>
                  <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', m: 0 }}>
                    {entry.responseJson}
                  </Typography>
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
        title="Preparing Your Risk Assessment"
        description={
          "Here we'll consider the Authoritative References for this domain and to understand what AI you are using.\nPlease answer the following questions to help us really understand what you're trying to do. This will help us prepare everything for the final risk assessment."
        }
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

          {!error && isFirstResponseReady && isIdentifiedStage(aiStage) ? (
            <Button
              size="large"
              variant="contained"
              onClick={() => {
                const sessionChatId = chatId?.trim();
                if (!sessionChatId) {
                  setError('Cannot assess risk: ai-id did not return a chat_id.');
                  return;
                }
                moveToAssessingRisk(sessionChatId);
              }}
              sx={{ mt: 1, px: 4, py: 1.5, borderRadius: 999 }}
            >
              Move to Risk Assessment phase
            </Button>
          ) : null}

          {!error && isFirstResponseReady && !isIdentifiedStage(aiStage) && !isSubmittingAnswer ? (
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
                    aria-label="Risk assessment preparation progress"
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

