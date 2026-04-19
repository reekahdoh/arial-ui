import { Alert, Box, MenuItem, TextField, Typography } from '@mui/material';
import { AppCTAButton } from '../../../components/ui/AppCTAButton';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { AppCard } from '../../../components/ui/AppCard';
import { PageHeader } from '../../../components/ui/PageHeader';
import { RiskAssessmentOvalSection } from '../../../components/ui/RiskAssessmentOvalSection';
import { isFirebaseConfigured } from '../../../services/firebase';
import {
  getLocalAssessment,
  newAssessmentId,
  type LocalAssessmentDraftFields,
  upsertLocalAssessment,
} from '../../../services/assessments/localAssessments';
import { getDomainByRouteKey } from '../../../services/domains/firestoreDomains';
import { getRiskAssessment, upsertRiskAssessment } from '../../../services/assessments/firestoreRiskAssessments';
import { appCtaButtonTrackSx } from '../../../theme/tokens';

type DomainKey = 'ai' | 'who';

const DOMAIN_OPTIONS: Array<{ key: DomainKey; label: string }> = [
  { key: 'ai', label: 'AI' },
  { key: 'who', label: 'WHO' },
];

function domainKeyFromName(name: string): DomainKey | null {
  const normalized = name.trim().toLowerCase();
  if (normalized === 'ai') return 'ai';
  if (normalized === 'who') return 'who';
  return null;
}

export function NewRiskAssessmentPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [assessmentId, setAssessmentId] = useState<string>('');
  const [owner, setOwner] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [domain, setDomain] = useState<DomainKey | ''>('');
  const [saveError, setSaveError] = useState<string | null>(null);
  /** Bumped after local persist so `isDirty` recalculates even when owner/company state values are unchanged. */
  const [persistTick, setPersistTick] = useState(0);

  useEffect(() => {
    const paramId = searchParams.get('assessmentId');
    const id = paramId || newAssessmentId();
    setAssessmentId(id);
    if (!paramId) {
      setSearchParams({ assessmentId: id }, { replace: true });
    }

    const existing = getLocalAssessment(id);
    if (existing) {
      setOwner(existing.draft.owner);
      setCompanyName(existing.draft.companyName);
      setDomain(existing.draft.domain);
      return;
    }

    if (!isFirebaseConfigured()) {
      return;
    }

    void (async () => {
      try {
        const remote = await getRiskAssessment(id);
        if (!remote) return;
        setOwner(remote.owner);
        setCompanyName(remote.companyName);
        if (remote.domainName) {
          const key = domainKeyFromName(remote.domainName);
          if (key) setDomain(key);
        }
      } catch {
        // ignore: keep empty form if cannot load
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isDirty = useMemo(() => {
    if (!assessmentId) return false;
    const existing = getLocalAssessment(assessmentId);
    if (!existing) {
      return owner.trim() !== '' || companyName.trim() !== '' || domain !== '';
    }
    return (
      existing.draft.owner !== owner.trim() ||
      existing.draft.companyName !== companyName.trim() ||
      existing.draft.domain !== domain
    );
  }, [assessmentId, owner, companyName, domain, persistTick]);

  const canSave = Boolean(domain) && isDirty;

  const save = () => {
    if (!assessmentId) return;
    if (!domain) {
      setSaveError('Please choose a domain before saving.');
      return;
    }
    setSaveError(null);

    const now = new Date().toISOString();
    const previous = getLocalAssessment(assessmentId);
    const draft: LocalAssessmentDraftFields = {
      owner: owner.trim(),
      companyName: companyName.trim(),
      domain,
      ...(previous?.draft.customerContext ? { customerContext: previous.draft.customerContext } : {}),
    };

    const title = draft.companyName ? `Risk assessment — ${draft.companyName}` : 'Risk assessment';

    upsertLocalAssessment({
      id: assessmentId,
      title,
      ownerName: draft.owner || '—',
      updatedAt: now,
      severity: 'medium',
      workflowStatus: 'draft',
      draft,
    });

    setOwner(draft.owner);
    setCompanyName(draft.companyName);
    setPersistTick((t) => t + 1);

    if (!isFirebaseConfigured()) {
      return;
    }

    void (async () => {
      try {
        const domainDoc = await getDomainByRouteKey(domain);
        await upsertRiskAssessment(assessmentId, {
          owner: draft.owner,
          companyName: draft.companyName,
          domainId: domainDoc?.id,
          domainName: domainDoc?.name,
        });
      } catch (err) {
        setSaveError(err instanceof Error ? err.message : 'Failed to save to Firestore');
      }
    })();
  };

  const customerContextEditAccessory = assessmentId ? (
    <Typography
      component={RouterLink}
      to={`/assessments/new/customer-context?assessmentId=${encodeURIComponent(assessmentId)}`}
      variant="body2"
      sx={{
        fontWeight: 600,
        color: 'primary.main',
        textDecoration: 'none',
        cursor: 'pointer',
        '&:hover': { textDecoration: 'underline' },
      }}
    >
      Edit
    </Typography>
  ) : (
    <Typography component="span" variant="body2" color="text.disabled" sx={{ fontWeight: 600 }}>
      Edit
    </Typography>
  );

  return (
    <>
      <PageHeader
        title="Risk Assessment"
        description="Start creating a new Risk Assessment"
        descriptionVariant="body1"
        descriptionSx={{ fontSize: '1rem', lineHeight: 1.45 }}
        actions={
          <Box sx={appCtaButtonTrackSx}>
            <AppCTAButton
              variant={isDirty ? 'contained' : 'outlined'}
              fullWidth
              onClick={save}
              disabled={!canSave}
            >
              Save
            </AppCTAButton>
          </Box>
        }
      />
      <AppCard>
        {saveError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {saveError}
          </Alert>
        ) : null}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <RiskAssessmentOvalSection
            title="Owner"
            description="Responsible for setting up this Risk Assessment"
          >
            <TextField
              label="Owner"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="e.g. Jane Doe"
              fullWidth
            />
          </RiskAssessmentOvalSection>

          <RiskAssessmentOvalSection
            title="Company"
            description="The company undergoing the Risk Assessment"
          >
            <TextField
              label="Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Futurist Ventures"
              fullWidth
            />
          </RiskAssessmentOvalSection>

          <RiskAssessmentOvalSection
            title="Domain"
            description="A focused area of the business or system (such as AI, security, or finance) where related risks are grouped so they can be assessed, owned, and managed consistently"
            titleAccessory={
              domain ? (
                <Typography
                  component={RouterLink}
                  to={`/domains/${domain}`}
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: 'primary.main',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Edit
                </Typography>
              ) : (
                <Typography component="span" variant="body2" color="text.disabled" sx={{ fontWeight: 600 }}>
                  Edit
                </Typography>
              )
            }
          >
            <TextField
              select
              label="Domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value as DomainKey)}
              fullWidth
            >
              {DOMAIN_OPTIONS.map((opt) => (
                <MenuItem key={opt.key} value={opt.key}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          </RiskAssessmentOvalSection>

          <RiskAssessmentOvalSection
            title="Customer Context"
            description="Add customer-specific notes, stakeholders, or background for this assessment."
            titleAccessory={customerContextEditAccessory}
          >
            {null}
          </RiskAssessmentOvalSection>
        </Box>
      </AppCard>
    </>
  );
}
