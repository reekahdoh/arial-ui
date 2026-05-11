import { Alert, Box, Button } from '@mui/material';
import { type ReactNode, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useRiskAssessmentRun, type RiskAssessmentRunDraft } from '../../contexts/RiskAssessmentRunContext';
import { getLocalAssessment } from '../../services/assessments/localAssessments';
import { layout } from '../../theme/tokens';
import { TopBar } from './TopBar';

export interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { signOut } = useAuth();
  const { draft: liveRunDraft } = useRiskAssessmentRun();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpeningProjectRequirements, setIsOpeningProjectRequirements] = useState(false);
  const [runAssessmentError, setRunAssessmentError] = useState<string | null>(null);

  const shouldShowRunAssessment = false;

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

  const fallback = getFallbackRunDraft();
  const draft = liveRunDraft
    ? {
        ...liveRunDraft,
        customerReferenceText:
          liveRunDraft.customerReferenceText || fallback?.customerReferenceText || '',
      }
    : fallback;

  function isRiskAssessmentSaved(current: RiskAssessmentRunDraft | null): current is RiskAssessmentRunDraft {
    if (!current?.assessmentId || !current.domain) return false;
    const local = getLocalAssessment(current.assessmentId);
    if (!local) return false;
    return (
      (local.draft.name ?? '') === current.name.trim() &&
      local.draft.owner === current.owner.trim() &&
      (local.draft.riskOwner ?? '') === current.riskOwner.trim() &&
      local.draft.companyName === current.companyName.trim() &&
      local.draft.domain === current.domain
    );
  }

  const canOpenProjectRequirements = isRiskAssessmentSaved(draft);

  async function enterProjectRequirements() {
    if (isOpeningProjectRequirements) return;
    if (!canOpenProjectRequirements) {
      setRunAssessmentError('Save the Risk Assessment details before entering Project Requirements.');
      return;
    }

    setIsOpeningProjectRequirements(true);
    setRunAssessmentError(null);
    navigate(`/assessments/new/project-requirements?assessmentId=${encodeURIComponent(draft.assessmentId)}`);
    setIsOpeningProjectRequirements(false);
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
                    onClick={() => void enterProjectRequirements()}
                    disabled={isOpeningProjectRequirements || !canOpenProjectRequirements}
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
                    {isOpeningProjectRequirements ? 'Opening…' : 'Enter Project Requirements'}
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
