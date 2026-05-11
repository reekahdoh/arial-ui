import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { AppCTAButton } from '../../../components/ui/AppCTAButton';
import { Link as RouterLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import { AppCard } from '../../../components/ui/AppCard';
import { PageHeader } from '../../../components/ui/PageHeader';
import { RiskAssessmentOvalSection } from '../../../components/ui/RiskAssessmentOvalSection';
import { isFirebaseConfigured } from '../../../services/firebase';
import type { ProjectRequirementsFields } from '../../../domain/projectRequirements';
import { emptyProjectRequirements } from '../../../domain/projectRequirements';
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
import { createBackendAssessment, putBackendAssessmentRequirements } from '../../../services/assessments/backendAssessments';
import { getProjectRequirementsFile } from '../projectRequirementsFileCache';

type DomainKey = 'ai' | 'who';
type WizardStep = 'name' | 'owner' | 'riskOwner' | 'company' | 'domain' | 'customerDomain' | 'review';
type WizardDraftStorage = Partial<LocalAssessmentDraftFields> & { step?: WizardStep };

const WIZARD_STORAGE_PREFIX = 'aira.riskAssessmentWizard.';

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

function wizardStorageKey(assessmentId: string): string {
  return `${WIZARD_STORAGE_PREFIX}${assessmentId}`;
}

function readWizardDraft(assessmentId: string): WizardDraftStorage | null {
  try {
    const raw = localStorage.getItem(wizardStorageKey(assessmentId));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as WizardDraftStorage;
  } catch {
    return null;
  }
}

function writeWizardDraft(assessmentId: string, draft: WizardDraftStorage) {
  localStorage.setItem(wizardStorageKey(assessmentId), JSON.stringify(draft));
}

function clearWizardDraft(assessmentId: string) {
  localStorage.removeItem(wizardStorageKey(assessmentId));
}

function extractBackendAssessmentId(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number') return String(value);
  if (!value || typeof value !== 'object') return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = extractBackendAssessmentId(item);
      if (nested) return nested;
    }
    return null;
  }

  const record = value as Record<string, unknown>;
  const direct = record.assessment_id ?? record.assessmentId ?? record.id;
  const directId = extractBackendAssessmentId(direct);
  if (directId) return directId;

  for (const key of ['assessment', 'data', 'result']) {
    const nested = extractBackendAssessmentId(record[key]);
    if (nested) return nested;
  }

  return null;
}

function projectRequirementsRows(saved: ProjectRequirementsFields): Array<{ type: string; details: string }> {
  const rows: Array<{ type: string; details: string }> = [];
  const docLine = (saved.fileMeta ?? saved.fileName)?.trim();
  if (docLine) rows.push({ type: 'Document', details: docLine });
  if (saved.websiteUrl.trim()) rows.push({ type: 'Website', details: saved.websiteUrl.trim() });
  if (saved.emailTitle.trim()) rows.push({ type: 'Email', details: saved.emailTitle.trim() });
  if (saved.freeformText.trim()) rows.push({ type: 'Text', details: saved.freeformText.trim() });
  return rows;
}

function projectRequirementsFileFromLocationState(state: unknown): File | null {
  if (!state || typeof state !== 'object') return null;
  const maybeFile = (state as { projectRequirementsFile?: unknown }).projectRequirementsFile;
  return maybeFile instanceof File ? maybeFile : null;
}

export function NewRiskAssessmentPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { setDraft: setRunDraft } = useRiskAssessmentRun();

  const [assessmentId, setAssessmentId] = useState<string>('');
  const [step, setStep] = useState<WizardStep>('name');
  const [name, setName] = useState('');
  const [owner, setOwner] = useState('');
  const [riskOwner, setRiskOwner] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [domain, setDomain] = useState<DomainKey | ''>('');
  const [projectRequirements, setProjectRequirements] = useState<ProjectRequirementsFields>(() => emptyProjectRequirements());
  const [projectRequirementsFile, setProjectRequirementsFile] = useState<File | null>(() =>
    projectRequirementsFileFromLocationState(location.state),
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [projectRequirementsViewOpen, setProjectRequirementsViewOpen] = useState(false);
  const [projectRequirementsViewText, setProjectRequirementsViewText] = useState<string | null>(null);
  const [projectRequirementsViewError, setProjectRequirementsViewError] = useState<string | null>(null);
  const [isReadingProjectRequirementsFile, setIsReadingProjectRequirementsFile] = useState(false);
  /** Bumped after local persist so `isDirty` recalculates even when form state values are unchanged. */
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
      setName(existing.draft.name ?? '');
      setOwner(existing.draft.owner);
      setRiskOwner(existing.draft.riskOwner ?? '');
      setCompanyName(existing.draft.companyName);
      setDomain(existing.draft.domain);
      setProjectRequirements(existing.draft.customerContext ?? emptyProjectRequirements());
      setStep('review');
      return;
    }

    const wizardDraft = readWizardDraft(id);
    if (wizardDraft) {
      setName(wizardDraft.name ?? '');
      setOwner(wizardDraft.owner ?? '');
      setRiskOwner(wizardDraft.riskOwner ?? '');
      setCompanyName(wizardDraft.companyName ?? '');
      setDomain(wizardDraft.domain ?? '');
      setStep(wizardDraft.step ?? 'name');
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
        setProjectRequirements(remote.customerContext ?? emptyProjectRequirements());
        setStep('review');
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
      customerContext: projectRequirements,
      customerReferenceText: projectRequirements.freeformText,
    });

    return () => setRunDraft(null);
  }, [assessmentId, companyName, domain, name, owner, persistTick, projectRequirements, riskOwner, setRunDraft]);

  useEffect(() => {
    const nextFile = projectRequirementsFileFromLocationState(location.state);
    if (nextFile) {
      setProjectRequirementsFile(nextFile);
      return;
    }
    if (assessmentId) {
      const cachedFile = getProjectRequirementsFile(assessmentId);
      if (cachedFile) setProjectRequirementsFile(cachedFile);
    }
  }, [assessmentId, location.state]);

  const wizardDraft: Partial<LocalAssessmentDraftFields> = {
    name: name.trim(),
    owner: owner.trim(),
    riskOwner: riskOwner.trim(),
    companyName: companyName.trim(),
    ...(domain ? { domain } : {}),
  };

  const persistWizardDraft = (nextDraft: WizardDraftStorage = wizardDraft) => {
    if (!assessmentId) return;
    writeWizardDraft(assessmentId, nextDraft);
  };

  const stepOrder: WizardStep[] = ['name', 'owner', 'riskOwner', 'company', 'domain', 'customerDomain', 'review'];
  const stepIsComplete = (() => {
    switch (step) {
      case 'name':
        return name.trim() !== '';
      case 'owner':
        return owner.trim() !== '';
      case 'riskOwner':
        return riskOwner.trim() !== '';
      case 'company':
        return companyName.trim() !== '';
      case 'domain':
        return Boolean(domain);
      case 'customerDomain':
        return true;
      case 'review':
        return Boolean(domain);
    }
  })();

  const nextStep = () => {
    if (!stepIsComplete) return;
    const currentIndex = stepOrder.indexOf(step);
    const next = stepOrder[Math.min(currentIndex + 1, stepOrder.length - 1)];
    persistWizardDraft({ ...wizardDraft, step: next });
    setStep(next);
  };

  const save = async (): Promise<boolean> => {
    if (!assessmentId) return false;
    if (!domain) {
      setSaveError('Please choose an Authoritative Domain before saving.');
      return false;
    }
    setSaveError(null);
    setIsSaving(true);

    const now = new Date().toISOString();
    const previous = getLocalAssessment(assessmentId);
    const baseDraft: LocalAssessmentDraftFields = {
      name: name.trim(),
      owner: owner.trim(),
      riskOwner: riskOwner.trim(),
      companyName: companyName.trim(),
      domain,
      ...(previous?.draft.backendAssessmentId ? { backendAssessmentId: previous.draft.backendAssessmentId } : {}),
      ...(previous?.draft.customerContext ? { customerContext: previous.draft.customerContext } : {}),
    };

    let backendAssessmentId = baseDraft.backendAssessmentId;
    try {
      const result = await createBackendAssessment({
        userId: baseDraft.owner,
        name: baseDraft.name ?? '',
        description: baseDraft.companyName
          ? `Risk assessment for ${baseDraft.companyName}`
          : 'Risk assessment',
      });
      if (!result.ok) {
        throw new Error(`POST /assessments returned ${result.status}: ${result.raw || '(empty response)'}`);
      }
      const returnedAssessmentId = extractBackendAssessmentId(result.data);
      if (!returnedAssessmentId) {
        throw new Error('POST /assessments did not return an assessment id.');
      }
      backendAssessmentId = returnedAssessmentId;
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to create backend assessment.');
      setIsSaving(false);
      return false;
    }

    const draft: LocalAssessmentDraftFields = {
      ...baseDraft,
      backendAssessmentId,
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
    clearWizardDraft(assessmentId);

    setName(draft.name ?? '');
    setOwner(draft.owner);
    setRiskOwner(draft.riskOwner ?? '');
    setCompanyName(draft.companyName);
    setPersistTick((t) => t + 1);
    setIsSaving(false);

    if (!isFirebaseConfigured()) {
      return true;
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

    return true;
  };

  const saveAndEnterProjectRequirements = async () => {
    if (!(await save())) return;
    navigate(`/assessments/new/project-requirements?assessmentId=${encodeURIComponent(assessmentId)}`);
  };

  const customerDomainPath = `/customer-domain?assessmentId=${encodeURIComponent(assessmentId)}`;
  const projectRequirementsPath = `/assessments/new/project-requirements?assessmentId=${encodeURIComponent(assessmentId)}`;

  const customerDomainEditAccessory = (
    <Typography component="span" variant="body2" color="primary.main" sx={{ fontWeight: 600 }}>
      Edit
    </Typography>
  );

  const projectRequirementsSummaryRows = projectRequirementsRows(projectRequirements);
  const hasProjectRequirements = projectRequirementsSummaryRows.length > 0;
  const allRiskAssessmentFieldsComplete = Boolean(
    name.trim() &&
      owner.trim() &&
      riskOwner.trim() &&
      companyName.trim() &&
      domain,
  );
  const savedLocalAssessment = assessmentId ? getLocalAssessment(assessmentId) : null;
  const backendAssessmentId = savedLocalAssessment?.draft.backendAssessmentId ?? '';

  const viewProjectRequirementsFile = async (event: MouseEvent | KeyboardEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const file = projectRequirementsFile ?? (assessmentId ? getProjectRequirementsFile(assessmentId) : null);
    setProjectRequirementsViewOpen(true);
    setProjectRequirementsViewText(null);
    setProjectRequirementsViewError(null);

    if (!file) {
      setProjectRequirementsViewError(
        'The browser no longer has access to this file. Open Project Requirements and choose the file again.',
      );
      return;
    }

    setProjectRequirementsFile(file);
    setIsReadingProjectRequirementsFile(true);
    try {
      const text = await file.text();
      setProjectRequirementsViewText(text || '(The selected file is empty.)');
    } catch (err) {
      setProjectRequirementsViewError(err instanceof Error ? err.message : 'Failed to read the selected file.');
    } finally {
      setIsReadingProjectRequirementsFile(false);
    }
  };

  const projectRequirementsEditAccessory = (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5 }}>
      {projectRequirements.fileName ? (
        <Typography
          component="span"
          role="button"
          tabIndex={0}
          variant="body2"
          color="primary.main"
          sx={{ fontWeight: 600, cursor: 'pointer' }}
          onClick={viewProjectRequirementsFile}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              void viewProjectRequirementsFile(event);
            }
          }}
        >
          View
        </Typography>
      ) : null}
      <Typography component="span" variant="body2" color="primary.main" sx={{ fontWeight: 600 }}>
        Edit
      </Typography>
    </Box>
  );

  const runRiskAssessment = async () => {
    if (!backendAssessmentId || !projectRequirementsFile) {
      const cachedFile = assessmentId ? getProjectRequirementsFile(assessmentId) : null;
      if (cachedFile) {
        setProjectRequirementsFile(cachedFile);
      } else {
        setSaveError('Open Project Requirements, choose a document, and save it before running the assessment.');
        return;
      }
    }
    const fileToUpload = projectRequirementsFile ?? (assessmentId ? getProjectRequirementsFile(assessmentId) : null);
    if (!backendAssessmentId || !fileToUpload) {
      return;
    }
    setSaveError(null);
    setIsRunning(true);
    try {
      const result = await putBackendAssessmentRequirements(backendAssessmentId, {
        userId: 'online user',
        name: savedLocalAssessment?.draft.name?.trim() || savedLocalAssessment?.title.trim() || name.trim() || 'Risk assessment',
        description: savedLocalAssessment?.draft.riskOwner?.trim() || riskOwner.trim() || 'Risk owner',
        file: fileToUpload,
      });
      if (!result.ok) {
        throw new Error(`PUT /assessments/${backendAssessmentId}/requirements returned ${result.status}: ${result.raw || '(empty response)'}`);
      }
      navigate(`/assessments/running?assessmentId=${encodeURIComponent(backendAssessmentId)}`, {
        state: {
          assessmentId: backendAssessmentId,
          localAssessmentId: assessmentId,
        },
      });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to run risk assessment');
    } finally {
      setIsRunning(false);
    }
  };

  const handleReviewAction = async () => {
    if (hasProjectRequirements) {
      await runRiskAssessment();
      return;
    }
    await saveAndEnterProjectRequirements();
  };

  const linkPanelSx = {
    width: '100%',
    border: '1px solid',
    color: 'inherit',
    cursor: 'pointer',
    font: 'inherit',
    textAlign: 'left',
    textDecoration: 'none',
    '&:hover': {
      borderColor: 'primary.main',
    },
    '&:focus-visible': {
      outline: '2px solid',
      outlineColor: 'primary.main',
      outlineOffset: 2,
    },
  } as const;

  const nextButton = (
    <Box sx={appCtaButtonTrackSx}>
      <AppCTAButton
        variant={stepIsComplete ? 'contained' : 'outlined'}
        fullWidth
        onClick={nextStep}
        disabled={!stepIsComplete}
      >
        Next
      </AppCTAButton>
    </Box>
  );

  const renderStep = () => {
    if (step === 'name') {
      return (
        <>
          <RiskAssessmentOvalSection title="Name" description="The name for this Risk Assessment">
            <TextField
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Vehicle Colour Classification Assessment"
              fullWidth
              autoFocus
            />
          </RiskAssessmentOvalSection>
          {nextButton}
        </>
      );
    }

    if (step === 'owner') {
      return (
        <>
          <RiskAssessmentOvalSection title="Owner" description="Responsible for setting up this Risk Assessment">
            <TextField
              label="Owner"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="e.g. Jane Doe"
              fullWidth
              autoFocus
            />
          </RiskAssessmentOvalSection>
          {nextButton}
        </>
      );
    }

    if (step === 'riskOwner') {
      return (
        <>
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
              autoFocus
            />
          </RiskAssessmentOvalSection>
          {nextButton}
        </>
      );
    }

    if (step === 'company') {
      return (
        <>
          <RiskAssessmentOvalSection title="Company" description="The company undergoing the Risk Assessment">
            <TextField
              label="Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Futurist Ventures"
              fullWidth
              autoFocus
            />
          </RiskAssessmentOvalSection>
          {nextButton}
        </>
      );
    }

    if (step === 'domain') {
      return (
        <>
          <RiskAssessmentOvalSection
            title="Authoritative Domain"
            description="A focused area of the business or system where related risks are grouped so they can be assessed, owned, and managed consistently"
          >
            <TextField
              select
              label="Authoritative Domain"
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
          {nextButton}
        </>
      );
    }

    if (step === 'customerDomain') {
      return (
        <>
          <RiskAssessmentOvalSection
            component={RouterLink}
            {...{ to: customerDomainPath }}
            title="Customer Domain"
            description="Capture customer-specific domain references and context for this assessment."
            titleAccessory={customerDomainEditAccessory}
            sx={linkPanelSx}
          >
            {null}
          </RiskAssessmentOvalSection>
          {nextButton}
        </>
      );
    }

    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          gap: 3,
          alignItems: 'stretch',
          '& > *': {
            minWidth: 0,
          },
        }}
      >
        <RiskAssessmentOvalSection title="Name" description="The name for this Risk Assessment">
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
        </RiskAssessmentOvalSection>

        <RiskAssessmentOvalSection title="Owner" description="Responsible for setting up this Risk Assessment">
          <TextField label="Owner" value={owner} onChange={(e) => setOwner(e.target.value)} fullWidth />
        </RiskAssessmentOvalSection>

        <RiskAssessmentOvalSection
          title="Risk Owner"
          description="Responsible for owning and managing risk decisions during this assessment"
        >
          <TextField label="Risk Owner" value={riskOwner} onChange={(e) => setRiskOwner(e.target.value)} fullWidth />
        </RiskAssessmentOvalSection>

        <RiskAssessmentOvalSection title="Company" description="The company undergoing the Risk Assessment">
          <TextField label="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} fullWidth />
        </RiskAssessmentOvalSection>

        <RiskAssessmentOvalSection
          title="Authoritative Domain"
          description="A focused area of the business or system where related risks are grouped so they can be assessed, owned, and managed consistently"
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
            label="Authoritative Domain"
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
          component={RouterLink}
          {...{ to: customerDomainPath }}
          title="Customer Domain"
          description="Capture customer-specific domain references and context for this assessment."
          titleAccessory={customerDomainEditAccessory}
          sx={linkPanelSx}
        >
          {null}
        </RiskAssessmentOvalSection>

        {hasProjectRequirements ? (
          <RiskAssessmentOvalSection
            component={RouterLink}
            {...{ to: projectRequirementsPath }}
            title="Project Requirements"
            description="Saved requirements and supporting references for this assessment."
            titleAccessory={projectRequirementsEditAccessory}
            sx={[
              linkPanelSx,
              {
                gridColumn: { xs: 'auto', md: '1 / -1' },
              },
            ]}
          >
            <Box sx={{ display: 'grid', gap: 0.75 }}>
              {projectRequirementsSummaryRows.map((row) => (
                <Typography key={`${row.type}-${row.details}`} variant="body2" color="text.secondary">
                  <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {row.type}:
                  </Box>{' '}
                  {row.details}
                </Typography>
              ))}
            </Box>
          </RiskAssessmentOvalSection>
        ) : null}
      </Box>
    );
  };

  return (
    <>
      <PageHeader
        title="Risk Assessment"
        description="Start creating a new Risk Assessment"
        descriptionVariant="body1"
        descriptionSx={{ fontSize: '1rem', lineHeight: 1.45 }}
        actions={
          step === 'review' ? (
            <Box sx={appCtaButtonTrackSx}>
              <AppCTAButton
                variant={domain ? 'contained' : 'outlined'}
                color={hasProjectRequirements ? 'success' : 'primary'}
                fullWidth
                onClick={() => void handleReviewAction()}
                disabled={!allRiskAssessmentFieldsComplete || isSaving || isRunning}
              >
                {isSaving
                  ? 'Saving…'
                  : isRunning
                    ? 'Starting…'
                    : hasProjectRequirements
                      ? 'Run Risk Assessment'
                      : 'Add Project Requirements'}
              </AppCTAButton>
            </Box>
          ) : undefined
        }
      />
      <AppCard>
        {saveError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {saveError}
          </Alert>
        ) : null}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {renderStep()}
        </Box>
      </AppCard>
      <Dialog
        open={projectRequirementsViewOpen}
        onClose={() => setProjectRequirementsViewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Project Requirements File</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 1.5, pt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              {projectRequirements.fileMeta ?? projectRequirements.fileName ?? 'Selected file'}
            </Typography>
            {isReadingProjectRequirementsFile ? (
              <Typography variant="body2" color="text.secondary">
                Reading file…
              </Typography>
            ) : projectRequirementsViewError ? (
              <Alert severity="warning">{projectRequirementsViewError}</Alert>
            ) : (
              <Box
                component="pre"
                sx={{
                  m: 0,
                  p: 2,
                  maxHeight: '60vh',
                  overflow: 'auto',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: 'surface.inset',
                  color: 'text.primary',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {projectRequirementsViewText ?? ''}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProjectRequirementsViewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
