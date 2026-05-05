import { PlayArrow } from '@mui/icons-material';
import { Alert, Box, Button } from '@mui/material';
import { type ReactNode, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useRiskAssessmentRun, type RiskAssessmentRunDraft } from '../../contexts/RiskAssessmentRunContext';
import { createBackendAssessment } from '../../services/assessments/backendAssessments';
import { getLocalAssessment, upsertLocalAssessment } from '../../services/assessments/localAssessments';
import { upsertRiskAssessment } from '../../services/assessments/firestoreRiskAssessments';
import { getDomainByRouteKey } from '../../services/domains/firestoreDomains';
import { isFirebaseConfigured } from '../../services/firebase';
import { layout } from '../../theme/tokens';
import { TopBar } from './TopBar';

export interface AppShellProps {
  children: ReactNode;
}

function extractAssessmentId(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number') return String(value);
  if (!value || typeof value !== 'object') return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = extractAssessmentId(item);
      if (nested) return nested;
    }
    return null;
  }

  const record = value as Record<string, unknown>;
  const raw = record.assessment_id ?? record.assessmentId ?? record.id;
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  if (typeof raw === 'number') return String(raw);

  for (const nestedKey of ['assessment', 'data', 'result']) {
    const nested = extractAssessmentId(record[nestedKey]);
    if (nested) return nested;
  }

  return null;
}

export function AppShell({ children }: AppShellProps) {
  const { signOut } = useAuth();
  const { draft: liveRunDraft } = useRiskAssessmentRun();
  const navigate = useNavigate();
  const location = useLocation();
  const [isStartingAssessment, setIsStartingAssessment] = useState(false);
  const [runAssessmentError, setRunAssessmentError] = useState<string | null>(null);

  const shouldShowRunAssessment = location.pathname === '/assessments/new';

  function getFallbackRunDraft(): RiskAssessmentRunDraft | null {
    const assessmentId = new URLSearchParams(location.search).get('assessmentId') ?? '';
    if (!assessmentId) return null;

    const local = getLocalAssessment(assessmentId);
    if (!local) return null;

    return {
      assessmentId,
      name: local.draft.name ?? '',
      owner: local.draft.owner,
      riskOwner: local.draft.riskOwner ?? '',
      companyName: local.draft.companyName,
      domain: local.draft.domain,
      customerContext: local.draft.customerContext,
      customerReferenceText: local.draft.customerContext?.freeformText ?? '',
    };
  }

  async function persistRunDraft(draft: RiskAssessmentRunDraft) {
    if (!draft.domain) {
      throw new Error('Please choose a domain before running the assessment.');
    }

    const localPrevious = getLocalAssessment(draft.assessmentId);
    const now = new Date().toISOString();
    const persistedDraft = {
      name: draft.name.trim(),
      owner: draft.owner.trim(),
      riskOwner: draft.riskOwner.trim(),
      companyName: draft.companyName.trim(),
      domain: draft.domain,
      ...(draft.customerContext
        ? { customerContext: draft.customerContext }
        : localPrevious?.draft.customerContext
          ? { customerContext: localPrevious.draft.customerContext }
          : {}),
    };
    const title =
      persistedDraft.name ||
      (persistedDraft.companyName ? `Risk assessment — ${persistedDraft.companyName}` : 'Risk assessment');

    upsertLocalAssessment({
      id: draft.assessmentId,
      title,
      ownerName: persistedDraft.owner || '—',
      updatedAt: now,
      severity: localPrevious?.severity ?? 'medium',
      workflowStatus: localPrevious?.workflowStatus ?? 'draft',
      draft: persistedDraft,
    });

    if (!isFirebaseConfigured()) {
      return;
    }

    const domainDoc = await getDomainByRouteKey(draft.domain);
    await upsertRiskAssessment(draft.assessmentId, {
      name: persistedDraft.name,
      owner: persistedDraft.owner,
      riskOwner: persistedDraft.riskOwner,
      companyName: persistedDraft.companyName,
      domainId: domainDoc?.id,
      domainName: domainDoc?.name,
    });
  }

  async function runAssessment() {
    if (isStartingAssessment) return;

    const fallback = getFallbackRunDraft();
    const draft = liveRunDraft
      ? {
          ...liveRunDraft,
          customerReferenceText:
            liveRunDraft.customerReferenceText || fallback?.customerReferenceText || '',
        }
      : fallback;

    const owner = draft?.owner.trim() ?? '';
    const name = draft?.name.trim() ?? '';
    const requirement = draft?.customerReferenceText.trim() ?? '';

    if (!owner || !name || !requirement) {
      setRunAssessmentError(
        'Please enter an Owner, Name, and Customer Reference text before running the assessment.',
      );
      return;
    }

    setIsStartingAssessment(true);
    setRunAssessmentError(null);

    try {
      if (!draft) {
        throw new Error('Unable to save risk assessment');
      }

      await persistRunDraft(draft);

      const result = await createBackendAssessment({
        userId: owner,
        name,
        description: 'Description of this assessment',
        requirement,
      });

      if (!result.ok) {
        throw new Error('Unable to save risk assessment');
      }

      const displayAssessmentId = extractAssessmentId(result.data);
      if (!displayAssessmentId) {
        throw new Error('Unable to save risk assessment');
      }
      const runningPath = `/assessments/running?assessmentId=${encodeURIComponent(displayAssessmentId)}`;

      navigate(runningPath, {
        state: {
          assessmentId: displayAssessmentId,
          localAssessmentId: draft?.assessmentId,
          backendAssessment: result.data,
        },
      });
    } catch {
      setRunAssessmentError('Unable to save risk assessment');
    } finally {
      setIsStartingAssessment(false);
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}
    >
      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          minHeight: 0,
        }}
      >
        <TopBar />
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          <Box
            sx={{
              flex: 1,
              px: layout.contentPaddingX,
              py: layout.contentPaddingY,
              maxWidth: layout.contentMaxWidth,
              mx: 'auto',
              width: '100%',
            }}
          >
            {children}
          </Box>
          <Box
            sx={{
              px: layout.contentPaddingX,
              pb: 2,
              pt: 1,
              maxWidth: layout.contentMaxWidth,
              mx: 'auto',
              width: '100%',
              flexShrink: 0,
            }}
          >
            {shouldShowRunAssessment ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, mb: 1 }}>
                {runAssessmentError ? (
                  <Alert severity="error" sx={{ width: '100%', maxWidth: 720 }} onClose={() => setRunAssessmentError(null)}>
                    {runAssessmentError}
                  </Alert>
                ) : null}
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<PlayArrow />}
                    onClick={() => void runAssessment()}
                    disabled={isStartingAssessment}
                    sx={{
                      fontWeight: 700,
                      textTransform: 'none',
                      borderRadius: 999,
                      py: 1.25,
                      px: 2.25,
                      width: 'fit-content',
                      minWidth: 0,
                      maxWidth: '100%',
                    }}
                  >
                    {isStartingAssessment ? 'Starting…' : 'Run Risk Assessment'}
                  </Button>
                </Box>
              </Box>
            ) : null}
            <Button
              variant="text"
              color="inherit"
              onClick={() => void signOut().then(() => navigate('/', { replace: true }))}
              sx={{ color: 'text.secondary', fontWeight: 600, px: 0 }}
            >
              Sign out
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
