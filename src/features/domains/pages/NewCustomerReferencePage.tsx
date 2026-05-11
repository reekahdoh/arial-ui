import { Alert, Box, Button, Divider, TextField, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AppCTAButton } from '../../../components/ui/AppCTAButton';
import { AppCard } from '../../../components/ui/AppCard';
import { PageHeader } from '../../../components/ui/PageHeader';
import { RiskAssessmentOvalSection } from '../../../components/ui/RiskAssessmentOvalSection';
import { appCtaButtonTrackSx } from '../../../theme/tokens';
import {
  newCustomerDomainReferenceId,
  readCustomerDomainReferences,
  writeCustomerDomainReferences,
  type CustomerDomainReferenceKind,
} from '../customerDomainReferencesStorage';

const referenceTypePillSx = {
  flex: 1,
  minWidth: 0,
  py: 1.25,
  px: 2,
  borderRadius: 9999,
  textTransform: 'none',
  fontWeight: 600,
} as const;

type DomainKey = 'ai' | 'who';

function isDomainKey(value: unknown): value is DomainKey {
  return value === 'ai' || value === 'who';
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function formatFileValue(file: File): string {
  const kb = Math.max(1, Math.round(file.size / 1024));
  const type = file.type ? file.type : 'unknown type';
  return `${file.name} (${type}, ${kb} KB)`;
}

export function NewCustomerReferencePage() {
  const params = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const domain = useMemo(() => (isDomainKey(params.domainKey) ? params.domainKey : null), [params.domainKey]);
  const assessmentId = searchParams.get('assessmentId') ?? '';
  const referenceScope = assessmentId || domain || 'default';
  const backTo = assessmentId
    ? `/customer-domain?assessmentId=${encodeURIComponent(assessmentId)}`
    : domain
      ? `/customer-domains/${domain}`
      : '/customer-domain';

  const [kind, setKind] = useState<CustomerDomainReferenceKind>('document');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = useMemo(() => {
    if (kind === 'website') return isValidHttpUrl(url.trim());
    return !!file;
  }, [kind, url, file]);

  const save = async () => {
    if (!canSave) return;
    setError(null);
    setSaving(true);

    try {
      const value = kind === 'website' ? url.trim() : file ? formatFileValue(file) : '';
      const existing = readCustomerDomainReferences(referenceScope);
      const next = [
        { id: newCustomerDomainReferenceId(), kind, value, createdAt: new Date().toISOString() },
        ...existing,
      ];
      writeCustomerDomainReferences(referenceScope, next);
      navigate(backTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save customer reference');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="New Customer Reference"
        description={
          <>
            Here you can add a Customer Reference, either from a website or a local document.
            <br />
            <br />
            These Customer References will help define your customer domain, so be sure to include any relevant
            customer documentation, policies, or source material.
          </>
        }
        actions={
          <>
            <Button component={RouterLink} to={backTo} variant="outlined" size="small">
              Cancel
            </Button>
            <Box sx={appCtaButtonTrackSx}>
              <AppCTAButton
                variant={canSave ? 'contained' : 'outlined'}
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
        {error ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <RiskAssessmentOvalSection
            title="Reference type"
            description="Choose whether this source is a file on your computer or a link on the web."
          >
            <Box sx={{ display: 'flex', gap: 1.5, width: '100%' }}>
              <Button
                type="button"
                variant={kind === 'document' ? 'contained' : 'outlined'}
                color="primary"
                disabled={saving}
                onClick={() => setKind('document')}
                sx={referenceTypePillSx}
              >
                Document
              </Button>
              <Button
                type="button"
                variant={kind === 'website' ? 'contained' : 'outlined'}
                color="primary"
                disabled={saving}
                onClick={() => setKind('website')}
                sx={referenceTypePillSx}
              >
                Website
              </Button>
            </Box>
          </RiskAssessmentOvalSection>

          {kind === 'document' ? (
            <RiskAssessmentOvalSection
              title="Document"
              description="Select a file from your computer."
            >
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <Button variant="outlined" component="label" size="small" disabled={saving}>
                  Choose file
                  <input
                    hidden
                    type="file"
                    onChange={(e) => {
                      const next = e.target.files?.[0] ?? null;
                      setFile(next);
                    }}
                  />
                </Button>
                {file ? (
                  <>
                    <Typography variant="data">{formatFileValue(file)}</Typography>
                    <Button
                      variant="text"
                      size="small"
                      disabled={saving}
                      onClick={() => {
                        setFile(null);
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
            </RiskAssessmentOvalSection>
          ) : (
            <RiskAssessmentOvalSection
              title="Website URL"
              description="Browse online in another tab, then paste the URL here."
            >
              <Box sx={{ display: 'grid', gap: 1.5 }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={saving}
                    onClick={() => window.open('https://www.google.com', '_blank', 'noopener,noreferrer')}
                  >
                    Open browser
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    This opens a new tab so you can copy a URL.
                  </Typography>
                </Box>

                <Divider />

                <TextField
                  label="Website URL"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/article"
                  fullWidth
                  autoFocus
                  error={!!url.trim() && !isValidHttpUrl(url.trim())}
                  helperText={
                    url.trim() && !isValidHttpUrl(url.trim())
                      ? 'Enter a valid http(s) URL.'
                      : 'Tip: include https://'
                  }
                />
              </Box>
            </RiskAssessmentOvalSection>
          )}
        </Box>
      </AppCard>
    </>
  );
}
