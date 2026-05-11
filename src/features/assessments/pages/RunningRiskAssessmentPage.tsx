import { Alert, Box, Button, TextField, Typography } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { AppCard } from '../../../components/ui/AppCard';
import { PageHeader } from '../../../components/ui/PageHeader';
import { useEffect, useState } from 'react';

function getAiIdBaseUrl(): string {
  return 'http://34.39.37.147:8080/ai-id';
}

const AI_ID_USER_ID = 'me';
const AI_ID_INITIAL_MESSAGE =
  'I am procuring an AI system for tracking vehicles in and across CCTV video.';

function getRiskIdUrl(): string {
  return 'http://34.39.37.147:8080/risk-id';
}

type AiIdJson = {
  chat_id: string;
  message: string;
  history: { role: string; content: string }[];
  chat_stage: string;
  turn_type: string;
};

/** Same query shape as the reference CURL: user_id + message only, empty POST body. */
function buildAiIdRequestUrl(userId: string, message: string) {
  const params = new URLSearchParams();
  params.set('user_id', userId);
  params.set('message', message);
  const base = getAiIdBaseUrl();
  return `${base}?${params.toString()}`;
}

async function postAiIdJson(
  url: string,
  signal: AbortSignal,
): Promise<{ ok: boolean; status: number; data: AiIdJson | null; raw: string }> {
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
    const data = JSON.parse(raw) as AiIdJson;
    return { ok: res.ok, status: res.status, data, raw };
  } catch {
    return { ok: res.ok, status: res.status, data: null, raw };
  }
}

async function postAndReadText(url: string, signal: AbortSignal) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { Accept: 'application/json, text/plain, */*' },
    signal,
  });

  const text = (await res.text()).trim();
  return { ok: res.ok, status: res.status, text };
}

async function postAndReadTextWithBetterNetworkError(url: string, signal: AbortSignal) {
  try {
    return await postAndReadText(url, signal);
  } catch (err) {
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      throw new Error(
        `Failed to fetch "${url}" (network/CORS). In dev, ensure the proxy is running and restart npm start after proxy changes.`,
      );
    }
    throw err;
  }
}

const IDENTIFYING_STAGE = 'identifying-ais';
const IDENTIFIED_STAGE = 'identified-ais';
const ANSWER_PROCESSING_STATUS =
  'Thanks, we’re analysing your answers against the Domain References to provide a clear Risk Result tailored for your project requirements.';

export function PreparingRiskAssessmentPage() {
  const [status, setStatus] = useState('Starting…');
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [aiStage, setAiStage] = useState<string | null>(null);
  const [hasStartedAiId, setHasStartedAiId] = useState(false);
  const [hasRunRisk, setHasRunRisk] = useState(false);
  const [isFirstResponseReady, setIsFirstResponseReady] = useState(false);
  const [hasEnteredQa, setHasEnteredQa] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      try {
        setStatus('Understanding your risk...');
        const url = buildAiIdRequestUrl(AI_ID_USER_ID, AI_ID_INITIAL_MESSAGE);
        const { ok, status: httpStatus, data, raw } = await postAiIdJson(url, controller.signal);
        if (!ok) {
          throw new Error(`ai-id returned ${httpStatus}: ${raw || '(empty response)'}`);
        }
        if (!data) {
          throw new Error(`ai-id returned non-JSON: ${raw || '(empty response)'}`);
        }

        setHasStartedAiId(true);
        setAiStage(data.chat_stage);
        setQuestion(data.message || null);
        setIsFirstResponseReady(true);

        if (data.chat_stage === IDENTIFIED_STAGE) {
          setStatus('AI identified.');
        } else {
          setStatus('Ready.');
        }
      } catch (err) {
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

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (error) return;
    if (!hasStartedAiId) return;
    if (aiStage !== IDENTIFIED_STAGE) return;
    if (hasRunRisk) return;

    const controller = new AbortController();
    setHasRunRisk(true);
    void (async () => {
      try {
        setStatus('Calculating risk…');
        const { ok, status: httpStatus, text } = await postAndReadTextWithBetterNetworkError(
          getRiskIdUrl(),
          controller.signal,
        );
        if (!ok) {
          throw new Error(`risk-id returned ${httpStatus}: ${text || '(empty response)'}`);
        }
        setStatus(text ? `Done: ${text.replace(/^"|"$/g, '')}` : 'Done.');
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Failed to run risk assessment.');
      }
    })();

    return () => controller.abort();
  }, [aiStage, error, hasRunRisk, hasStartedAiId]);

  async function submitAnswer() {
    const trimmed = answer.trim();
    if (!trimmed) return;
    if (isSubmittingAnswer) return;
    if (error) return;
    if (aiStage === IDENTIFIED_STAGE) return;

    setIsSubmittingAnswer(true);
    setStatus(ANSWER_PROCESSING_STATUS);
    try {
      const controller = new AbortController();
      const url = buildAiIdRequestUrl(AI_ID_USER_ID, trimmed);
      const { ok, status: httpStatus, data, raw } = await postAiIdJson(url, controller.signal);
      if (!ok) {
        throw new Error(`ai-id returned ${httpStatus}: ${raw || '(empty response)'}`);
      }
      if (!data) {
        throw new Error(`ai-id returned non-JSON: ${raw || '(empty response)'}`);
      }

      setAiStage(data.chat_stage);
      setQuestion(data.message || null);
      setAnswer('');

      if (data.chat_stage === IDENTIFIED_STAGE) {
        setStatus('AI identified.');
      } else if (data.chat_stage === IDENTIFYING_STAGE) {
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

  return (
    <>
      <PageHeader
        title="Preparing Your Risk Assessment"
        description="Here we'll consider the Authoritative References for this domain and dig deeper into what your requirements are."
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
          <Typography variant="body2" color="text.secondary">
            {error ? 'Stopped.' : status}
          </Typography>

          {!error && isFirstResponseReady && !hasEnteredQa ? (
            <Button
              size="large"
              variant="contained"
              startIcon={<PlayArrowIcon />}
              onClick={() => {
                setHasEnteredQa(true);
                setStatus('');
              }}
              sx={{ mt: 1, px: 4, py: 1.5, borderRadius: 999 }}
            >
              Next
            </Button>
          ) : null}

          {!error && hasEnteredQa && aiStage !== IDENTIFIED_STAGE && !isSubmittingAnswer ? (
            <Box sx={{ width: '100%', maxWidth: 720, mt: 1 }}>
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
    </>
  );
}

