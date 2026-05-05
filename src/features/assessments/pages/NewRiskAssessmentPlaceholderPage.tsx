import { Alert, Box, MenuItem, TextField, Typography } from '@mui/material';
import { AppCTAButton } from '../../../components/ui/AppCTAButton';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AppCard } from '../../../components/ui/AppCard';
import { PageHeader } from '../../../components/ui/PageHeader';
import { RiskAssessmentOvalSection } from '../../../components/ui/RiskAssessmentOvalSection';
import { isFirebaseConfigured } from '../../../services/firebase';
import type { CustomerContextFields } from '../../../domain/customerContext';
import { emptyCustomerContext } from '../../../domain/customerContext';
import { useRiskAssessmentRun } from '../../../contexts/RiskAssessmentRunContext';
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
  const { setDraft: setRunDraft } = useRiskAssessmentRun();

  const [assessmentId, setAssessmentId] = useState<string>('');
  const [name, setName] = useState('');
  const [owner, setOwner] = useState('');
  const [riskOwner, setRiskOwner] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [domain, setDomain] = useState<DomainKey | ''>('');
  const [customerContext, setCustomerContext] = useState<CustomerContextFields>(() => emptyCustomerContext());
  const [saveError, setSaveError] = useState<string | null>(null);
  /** Bumped after local persist so `isDirty` recalculates even when form state values are unchanged. */
  const [, setPersistTick] = useState(0);

  useEffect(() => {
    const paramId = searchParams.get('assessmentId');
    const id = paramId || newAssessmentId();
    setAssessmentId(id);
    if (!paramId) {
      setSearchParams({ assessmentId: id }, { replace: true });
    }

    const existing = getLocalAssessment(id);
    if (existing) {
      setName(existing.draft.name ?? '');
      setOwner(existing.draft.owner);
      setRiskOwner(existing.draft.riskOwner ?? '');
      setCompanyName(existing.draft.companyName);
      setDomain(existing.draft.domain);
      setCustomerContext(existing.draft.customerContext ?? emptyCustomerContext());
      return;
    }

    if (!isFirebaseConfigured()) {
      return;
    }

    void (async () => {
      try {
        const remote = await getRiskAssessment(id);
        if (!remote) return;
        setName(remote.name ?? '');
        setOwner(remote.owner);
        setRiskOwner(remote.riskOwner ?? '');
        setCompanyName(remote.companyName);
        setCustomerContext(remote.customerContext ?? emptyCustomerContext());
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

  useEffect(() => {
    if (!assessmentId) {
      setRunDraft(null);
      return;
    }

    setRunDraft({
      assessmentId,
      name,
      owner,
      riskOwner,
      companyName,
      domain,
      customerContext,
      customerReferenceText: customerContext.freeformText,
    });

    return () => setRunDraft(null);
  }, [assessmentId, companyName, customerContext, domain, name, owner, riskOwner, setRunDraft]);

  const isDirty = (() => {
    if (!assessmentId) return false;
    const existing = getLocalAssessment(assessmentId);
    if (!existing) {
      return (
        name.trim() !== '' ||
        owner.trim() !== '' ||
        riskOwner.trim() !== '' ||
        companyName.trim() !== '' ||
        domain !== ''
      );
    }
    return (
      (existing.draft.name ?? '') !== name.trim() ||
      existing.draft.owner !== owner.trim() ||
      (existing.draft.riskOwner ?? '') !== riskOwner.trim() ||
      existing.draft.companyName !== companyName.trim() ||
      existing.draft.domain !== domain
    );
  })();

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
      name: name.trim(),
      owner: owner.trim(),
      riskOwner: riskOwner.trim(),
      companyName: companyName.trim(),
      domain,
      ...(previous?.draft.customerContext ? { customerContext: previous.draft.customerContext } : {}),
    };

    const title = draft.name || (draft.companyName ? `Risk assessment — ${draft.companyName}` : 'Risk assessment');

    upsertLocalAssessment({
      id: assessmentId,
      title,
      ownerName: draft.owner || '—',
      updatedAt: now,
      severity: 'medium',
      workflowStatus: 'draft',
      draft,
    });

    setName(draft.name ?? '');
    setOwner(draft.owner);
    setRiskOwner(draft.riskOwner ?? '');
    setCompanyName(draft.companyName);
    setPersistTick((t) => t + 1);

    if (!isFirebaseConfigured()) {
      return;
    }

    void (async () => {
      try {
        const domainDoc = await getDomainByRouteKey(domain);
        await upsertRiskAssessment(assessmentId, {
          name: draft.name ?? '',
          owner: draft.owner,
          riskOwner: draft.riskOwner,
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
            title="Name"
            description="The name for this Risk Assessment"
          >
            <TextField
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Vehicle Colour Classification Assessment"
              fullWidth
            />
          </RiskAssessmentOvalSection>

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
            title="Risk Owner"
            description="Responsible for owning and managing risk decisions during this assessment"
          >
            <TextField
              label="Risk Owner"
              value={riskOwner}
              onChange={(e) => setRiskOwner(e.target.value)}
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

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 3,
              alignItems: 'stretch',
              '& > *': {
                flex: '1 1 240px',
                minWidth: 0,
              },
            }}
          >
            <RiskAssessmentOvalSection
              title="Domain"
              description="A focused area of the business or system (such as AI, security, or finance) where related risks are grouped so they can be assessed, owned, and managed consistently"
              titleAccessory={
                domain ? (
                  <Typography
                    component={RouterLink}
                    to={`/domains/${domain}?assessmentId=${encodeURIComponent(assessmentId)}`}
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
        </Box>
      </AppCard>
    </>
  );
}
