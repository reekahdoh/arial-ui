import { Box, Button, Divider, TextField, Typography } from '@mui/material';
import { RiskAssessmentOvalSection } from '../../components/ui/RiskAssessmentOvalSection';
import type { ReferenceKind } from './domainReferencesStorage';
import { formatFileValue, isValidHttpUrl, referenceTypePillSx } from './domainReferenceFormShared';

function ReferenceTypeSelector({
  kind,
  saving,
  setKind,
}: {
  kind: ReferenceKind;
  saving: boolean;
  setKind: (kind: ReferenceKind) => void;
}) {
  return (
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
  );
}

function DocumentReferenceInput({
  file,
  saving,
  setFile,
}: {
  file: File | null;
  saving: boolean;
  setFile: (file: File | null) => void;
}) {
  return (
    <RiskAssessmentOvalSection title="Document" description="Select a file from your computer.">
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button variant="outlined" component="label" size="small" disabled={saving}>
          Choose file
          <input hidden type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </Button>
        {file ? (
          <>
            <Typography variant="data">{formatFileValue(file)}</Typography>
            <Button variant="text" size="small" disabled={saving} onClick={() => setFile(null)}>
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
  );
}

function WebsiteReferenceInput({
  url,
  saving,
  setUrl,
}: {
  url: string;
  saving: boolean;
  setUrl: (url: string) => void;
}) {
  const urlError = !!url.trim() && !isValidHttpUrl(url.trim());

  return (
    <RiskAssessmentOvalSection title="Website URL" description="Browse online in another tab, then paste the URL here.">
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
          error={urlError}
          helperText={urlError ? 'Enter a valid http(s) URL.' : 'Tip: include https://'}
        />
      </Box>
    </RiskAssessmentOvalSection>
  );
}

export function DomainReferenceForm({
  kind,
  setKind,
  url,
  setUrl,
  file,
  setFile,
  saving,
}: {
  kind: ReferenceKind;
  setKind: (kind: ReferenceKind) => void;
  url: string;
  setUrl: (url: string) => void;
  file: File | null;
  setFile: (file: File | null) => void;
  saving: boolean;
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <ReferenceTypeSelector kind={kind} saving={saving} setKind={setKind} />
      {kind === 'document' ? (
        <DocumentReferenceInput file={file} saving={saving} setFile={setFile} />
      ) : (
        <WebsiteReferenceInput url={url} saving={saving} setUrl={setUrl} />
      )}
    </Box>
  );
}
