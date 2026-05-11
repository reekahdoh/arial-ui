import { Add, EmailOutlined, InsertDriveFileOutlined, LanguageOutlined, TextFields } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppCTAButton, AppCTAButtonLink } from '../../../components/ui/AppCTAButton';
import { AppCard } from '../../../components/ui/AppCard';
import { PageHeader } from '../../../components/ui/PageHeader';
import { appCtaButtonTrackSx } from '../../../theme/tokens';
import type { ProjectRequirementsFields } from '../../../domain/projectRequirements';
import { emptyProjectRequirements, normalizeProjectRequirements } from '../../../domain/projectRequirements';
import {
  loadProjectRequirements,
  persistProjectRequirements,
} from '../../../services/assessments/projectRequirementsPersistence';
import { setProjectRequirementsFile } from '../projectRequirementsFileCache';
function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function toOpenableHttpUrl(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (isValidHttpUrl(t)) return t;
  const withScheme = `https://${t}`;
  return isValidHttpUrl(withScheme) ? withScheme : null;
}

function formatFileValue(file: File): string {
  const kb = Math.max(1, Math.round(file.size / 1024));
  const type = file.type ? file.type : 'unknown type';
  return `${file.name} (${type}, ${kb} KB)`;
}

const GMAIL_INBOX_URL = 'https://mail.google.com/mail/u/0/#inbox';

type ContextSectionId = 'document' | 'website' | 'email' | 'text';

const CONTEXT_TYPE_TILES: ReadonlyArray<{
  id: ContextSectionId;
  label: string;
  Icon: typeof InsertDriveFileOutlined;
}> = [
  { id: 'document', label: 'Document', Icon: InsertDriveFileOutlined },
  { id: 'website', label: 'Website', Icon: LanguageOutlined },
  { id: 'email', label: 'Email', Icon: EmailOutlined },
  { id: 'text', label: 'Text', Icon: TextFields },
];

function supportingContextRows(saved: ProjectRequirementsFields): Array<{ id: ContextSectionId; type: string; details: string }> {
  const rows: Array<{ id: ContextSectionId; type: string; details: string }> = [];
  const docLine = (saved.fileMeta ?? saved.fileName)?.trim();
  if (docLine) {
    rows.push({ id: 'document', type: 'Document', details: docLine });
  }
  if (saved.websiteUrl.trim()) {
    rows.push({ id: 'website', type: 'Website', details: saved.websiteUrl.trim() });
  }
  if (saved.emailTitle.trim()) {
    rows.push({ id: 'email', type: 'Email', details: saved.emailTitle.trim() });
  }
  if (saved.freeformText.trim()) {
    rows.push({ id: 'text', type: 'Text', details: saved.freeformText.trim() });
  }
  return rows;
}

export function AddProjectRequirementsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const assessmentId = searchParams.get('assessmentId') ?? '';

  const backTo = assessmentId
    ? `/assessments/new?assessmentId=${encodeURIComponent(assessmentId)}`
    : '/assessments/new';

  const [ctx, setCtx] = useState<ProjectRequirementsFields>(() => emptyProjectRequirements());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [baseline, setBaseline] = useState(() => JSON.stringify(emptyProjectRequirements()));
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [persistError, setPersistError] = useState<string | null>(null);
  const [persistInfo, setPersistInfo] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<ContextSectionId | null>(null);

  useEffect(() => {
    if (!assessmentId) {
      const empty = emptyProjectRequirements();
      setCtx(empty);
      setBaseline(JSON.stringify(empty));
      setLoadError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    const clearing = emptyProjectRequirements();
    setCtx(clearing);
    setBaseline(JSON.stringify(clearing));

    void (async () => {
      try {
        const loaded = await loadProjectRequirements(assessmentId);
        if (cancelled) return;
        setCtx(loaded);
        setBaseline(JSON.stringify(loaded));
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Failed to load saved context');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [assessmentId]);

  const openableUrl = toOpenableHttpUrl(ctx.websiteUrl);
  const websiteUrlError = !!ctx.websiteUrl.trim() && !openableUrl;

  const isDirty = useMemo(() => JSON.stringify(ctx) !== baseline, [ctx, baseline]);

  const savedSnapshot = useMemo((): ProjectRequirementsFields => {
    try {
      return normalizeProjectRequirements(JSON.parse(baseline) as Partial<ProjectRequirementsFields>);
    } catch {
      return emptyProjectRequirements();
    }
  }, [baseline]);

  const supportingRows = useMemo(() => supportingContextRows(savedSnapshot), [savedSnapshot]);

  useEffect(() => {
    if (isDirty) setPersistInfo(null);
  }, [isDirty]);

  const canSave =
    !!assessmentId && !loading && !websiteUrlError && isDirty;
  const save = async (): Promise<boolean> => {
    if (!canSave) return false;
    setSaving(true);
    setPersistError(null);
    setPersistInfo(null);
    try {
      const result = await persistProjectRequirements(assessmentId, ctx);
      setSaving(false);
      if (!result.ok) {
        setPersistError(result.message);
        return false;
      }
      setBaseline(JSON.stringify(ctx));
      setPersistInfo('Saved.');
      if (selectedFile) {
        setProjectRequirementsFile(assessmentId, selectedFile);
      }
      navigate(`/assessments/new?assessmentId=${encodeURIComponent(assessmentId)}`, {
        state: selectedFile ? { projectRequirementsFile: selectedFile } : undefined,
      });
      return true;
    } catch (err) {
      setSaving(false);
      setPersistError(err instanceof Error ? err.message : 'Failed to save project requirements');
      return false;
    }
  };

  return (
    <>
      <PageHeader
        title="Add Project Requirements"
        description={
          <>
            Project Requirements capture what your project needs to achieve.
            <br />
            <br />• What is it that you need your solution to do?
            <br />• Why are you bringing this into your organisation?
            <br />
            <br />
            These requirements are likely captured in official documents, or web pages, but also in email threads. You
            can upload it all here.
          </>
        }
        descriptionVariant="body1"
        descriptionSx={{ fontSize: '1rem', lineHeight: 1.45 }}
        actions={
          <>
            <AppCTAButtonLink
              to={backTo}
              variant="outlined"
              size="small"
              sx={{ py: 0.5 }}
            >
              Back
            </AppCTAButtonLink>
            <Box sx={appCtaButtonTrackSx}>
              <AppCTAButton
                variant={isDirty ? 'contained' : 'outlined'}
                fullWidth
                onClick={() => void save()}
                disabled={!canSave || saving}
              >
                {saving ? 'Saving…' : 'Save'}
              </AppCTAButton>
            </Box>
          </>
        }
      />
      <AppCard>
        {loadError ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {loadError}
          </Alert>
        ) : null}
        {persistError ? (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPersistError(null)}>
            {persistError}
          </Alert>
        ) : null}
        {persistInfo ? (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setPersistInfo(null)}>
            {persistInfo}
          </Alert>
        ) : null}

        {supportingRows.length > 0 ? (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" component="h2" sx={{ mb: 1.5, fontWeight: 600 }}>
              Supporting Context
            </Typography>
            <TableContainer
              sx={(theme) => ({
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: `${theme.shapeBorderRadius.sm}px`,
                bgcolor: 'surface.inset',
                boxShadow: theme.shadowsElevation.hairline,
              })}
            >
              <Table size="small" aria-label="Supporting context">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, width: 120 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {supportingRows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell sx={{ verticalAlign: 'top', color: 'text.secondary', fontWeight: 600 }}>
                        {row.type}
                      </TableCell>
                      <TableCell sx={{ wordBreak: 'break-word' }}>{row.details}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ) : null}

        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: { xs: 1.5, sm: 2 } }}>
            <Add
              aria-hidden
              sx={{
                fontSize: { xs: 72, sm: 96 },
                color: 'primary.main',
              }}
            />
          </Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(4, minmax(0, 1fr))' },
              gap: { xs: 1, sm: 2 },
            }}
          >
            {CONTEXT_TYPE_TILES.map(({ id, label, Icon }) => {
              const selected = activeSection === id;
              return (
                <ButtonBase
                  key={id}
                  type="button"
                  disableRipple
                  onClick={() => setActiveSection(id)}
                  aria-pressed={selected}
                  aria-label={`Show ${label} context`}
                  sx={(theme) => ({
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1.25,
                    py: { xs: 1.75, sm: 2.25 },
                    px: { xs: 1, sm: 2 },
                    width: '100%',
                    borderRadius: `${theme.shapeBorderRadius.sm}px`,
                    border: '1px solid',
                    borderColor: selected ? 'primary.main' : 'divider',
                    bgcolor: selected ? 'action.selected' : 'surface.inset',
                    boxShadow: theme.shadowsElevation.hairline,
                    transition: theme.transitions.create(['border-color', 'background-color'], {
                      duration: theme.transitions.duration.shorter,
                    }),
                    '&:hover': {
                      bgcolor: selected ? 'action.selected' : 'action.hover',
                    },
                    '&.Mui-focusVisible': {
                      outline: `2px solid ${theme.palette.primary.main}`,
                      outlineOffset: 2,
                    },
                  })}
                >
                  <Icon
                    aria-hidden
                    sx={{
                      fontSize: { xs: 40, sm: 56 },
                      color: 'grey.700',
                      filter: 'grayscale(1)',
                    }}
                  />
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: undefined }, textAlign: 'center' }}
                  >
                    {label}
                  </Typography>
                </ButtonBase>
              );
            })}
          </Box>
        </Box>

        {activeSection !== null ? (
          <>
            {assessmentId ? (
              loading ? (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Loading saved context…
                </Typography>
              ) : (
                <Box sx={{ mb: 3 }} />
              )
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Open this page from a risk assessment so the assessment is linked.
              </Typography>
            )}

            <Box sx={{ display: 'grid', gap: 3, opacity: loading ? 0.6 : 1, pointerEvents: loading ? 'none' : 'auto' }}>
          {activeSection === 'document' ? (
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              <Typography variant="subtitle2">Local Document</Typography>
              <Typography variant="body2" color="text.secondary">
                Choose any files that contain relevant information about your project requirements.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <Button variant="outlined" component="label" size="small" disabled={!assessmentId || loading}>
                  Choose file
                  <input
                    hidden
                    type="file"
                    onChange={(e) => {
                      const next = e.target.files?.[0] ?? null;
                      if (!next) return;
                      setSelectedFile(next);
                      setCtx((c) => ({
                        ...c,
                        fileName: next.name,
                        fileMeta: formatFileValue(next),
                      }));
                    }}
                  />
                </Button>
                {ctx.fileMeta ? (
                  <>
                    <Typography variant="data">{ctx.fileMeta}</Typography>
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => {
                        setSelectedFile(null);
                        setCtx((c) => ({ ...c, fileName: null, fileMeta: null }));
                      }}
                    >
                      Clear
                    </Button>
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No file selected.
                  </Typography>
                )}
              </Box>
            </Box>
          ) : null}

          {activeSection === 'website' ? (
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              <Typography variant="subtitle2">Web pages</Typography>
              <Typography variant="body2" color="text.secondary">
                Choose any web pages that contain information, particularly compliance or regulatory standards relevant to
                your project requirements.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={!assessmentId || loading}
                  onClick={() => window.open('https://www.google.com', '_blank', 'noopener,noreferrer')}
                >
                  Open browser
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={!openableUrl || !assessmentId || loading}
                  onClick={() => {
                    if (!openableUrl) return;
                    window.open(openableUrl, '_blank', 'noopener,noreferrer');
                  }}
                >
                  Open this website
                </Button>
              </Box>
              <TextField
                label="Website URL"
                value={ctx.websiteUrl}
                onChange={(e) => setCtx((c) => ({ ...c, websiteUrl: e.target.value }))}
                placeholder="https://example.com or example.com"
                fullWidth
                error={websiteUrlError}
                helperText={
                  websiteUrlError
                    ? 'Enter a valid http(s) URL (https:// is added if you omit the scheme).'
                    : 'Tip: include https:// or we will try https:// automatically.'
                }
              />
            </Box>
          ) : null}

          {activeSection === 'email' ? (
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              <Typography variant="subtitle2">Email</Typography>
              <Typography variant="body2" color="text.secondary">
                Any threads of discussion about the project requirements can be uploaded here.
                <br />
                <br />
                (currently only works with Gmail)
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={!assessmentId || loading}
                  onClick={() => window.open(GMAIL_INBOX_URL, '_blank', 'noopener,noreferrer')}
                >
                  Open Gmail
                </Button>
              </Box>
              <TextField
                label="Email title (subject)"
                value={ctx.emailTitle}
                onChange={(e) => setCtx((c) => ({ ...c, emailTitle: e.target.value }))}
                placeholder="Paste or type the email subject line"
                fullWidth
              />
            </Box>
          ) : null}

          {activeSection === 'text' ? (
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              <Typography variant="subtitle2">Text</Typography>
              <Typography variant="body2" color="text.secondary">
                Write your requirements below, or just add extra context about your project here.
              </Typography>
              <TextField
                label="Project requirements text"
                value={ctx.freeformText}
                onChange={(e) => setCtx((c) => ({ ...c, freeformText: e.target.value }))}
                placeholder="Paste or type customer notes, background, constraints, or other context"
                fullWidth
                multiline
                minRows={5}
              />
            </Box>
          ) : null}
            </Box>
          </>
        ) : null}
      </AppCard>
    </>
  );
}
