import { Box, Button, TextField, Typography } from '@mui/material';
import { type ChangeEvent, type Dispatch, type SetStateAction } from 'react';
import type { ProjectRequirementsFields } from '../../../domain/projectRequirements';
import {
  formatFileValue,
  GMAIL_INBOX_URL,
  type ContextSectionId,
} from './addProjectRequirementsHelpers';

type SetProjectRequirements = Dispatch<SetStateAction<ProjectRequirementsFields>>;

function DocumentRequirementsSection({
  assessmentId,
  ctx,
  loading,
  setCtx,
  setSelectedFile,
}: {
  assessmentId: string;
  ctx: ProjectRequirementsFields;
  loading: boolean;
  setCtx: SetProjectRequirements;
  setSelectedFile: (file: File | null) => void;
}) {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const next = e.target.files?.[0] ?? null;
    if (!next) return;
    setSelectedFile(next);
    setCtx((c) => ({ ...c, fileName: next.name, fileMeta: formatFileValue(next) }));
  };

  const clearFile = () => {
    setSelectedFile(null);
    setCtx((c) => ({
      ...c,
      fileName: null,
      fileMeta: null,
      documentContent: null,
      requirementsDocId: null,
    }));
  };

  return (
    <Box sx={{ display: 'grid', gap: 1.5 }}>
      <Typography variant="subtitle2">Local Document</Typography>
      <Typography variant="body2" color="text.secondary">
        Choose any files that contain relevant information about your project requirements.
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button variant="outlined" component="label" size="small" disabled={!assessmentId || loading}>
          Choose file
          <input hidden type="file" onChange={handleFileChange} />
        </Button>
        {ctx.fileMeta ? (
          <>
            <Typography variant="data">{ctx.fileMeta}</Typography>
            <Button variant="text" size="small" onClick={clearFile}>
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
  );
}

function WebsiteRequirementsSection({
  assessmentId,
  ctx,
  loading,
  openableUrl,
  websiteUrlError,
  setCtx,
}: {
  assessmentId: string;
  ctx: ProjectRequirementsFields;
  loading: boolean;
  openableUrl: string | null;
  websiteUrlError: boolean;
  setCtx: SetProjectRequirements;
}) {
  const openWebsite = () => {
    if (!openableUrl) return;
    window.open(openableUrl, '_blank', 'noopener,noreferrer');
  };

  return (
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
        <Button variant="outlined" size="small" disabled={!openableUrl || !assessmentId || loading} onClick={openWebsite}>
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
        helperText={websiteUrlError ? 'Enter a valid http(s) URL (https:// is added if you omit the scheme).' : 'Tip: include https:// or we will try https:// automatically.'}
      />
    </Box>
  );
}

function EmailRequirementsSection({
  assessmentId,
  ctx,
  loading,
  setCtx,
}: {
  assessmentId: string;
  ctx: ProjectRequirementsFields;
  loading: boolean;
  setCtx: SetProjectRequirements;
}) {
  return (
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
  );
}

function TextRequirementsSection({
  ctx,
  setCtx,
}: {
  ctx: ProjectRequirementsFields;
  setCtx: SetProjectRequirements;
}) {
  return (
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
  );
}

function SectionStatusMessage({ assessmentId, loading }: { assessmentId: string; loading: boolean }) {
  if (!assessmentId) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Open this page from a risk assessment so the assessment is linked.
      </Typography>
    );
  }

  return loading ? (
    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
      Loading saved context…
    </Typography>
  ) : (
    <Box sx={{ mb: 3 }} />
  );
}

function ActiveSectionContent({
  activeSection,
  assessmentId,
  ctx,
  loading,
  openableUrl,
  websiteUrlError,
  setCtx,
  setSelectedFile,
}: {
  activeSection: ContextSectionId;
  assessmentId: string;
  ctx: ProjectRequirementsFields;
  loading: boolean;
  openableUrl: string | null;
  websiteUrlError: boolean;
  setCtx: SetProjectRequirements;
  setSelectedFile: (file: File | null) => void;
}) {
  switch (activeSection) {
    case 'document':
      return <DocumentRequirementsSection assessmentId={assessmentId} ctx={ctx} loading={loading} setCtx={setCtx} setSelectedFile={setSelectedFile} />;
    case 'website':
      return <WebsiteRequirementsSection assessmentId={assessmentId} ctx={ctx} loading={loading} openableUrl={openableUrl} websiteUrlError={websiteUrlError} setCtx={setCtx} />;
    case 'email':
      return <EmailRequirementsSection assessmentId={assessmentId} ctx={ctx} loading={loading} setCtx={setCtx} />;
    case 'text':
      return <TextRequirementsSection ctx={ctx} setCtx={setCtx} />;
  }
}

export function ActiveRequirementsSection({
  activeSection,
  assessmentId,
  ctx,
  loading,
  openableUrl,
  websiteUrlError,
  setCtx,
  setSelectedFile,
}: {
  activeSection: ContextSectionId | null;
  assessmentId: string;
  ctx: ProjectRequirementsFields;
  loading: boolean;
  openableUrl: string | null;
  websiteUrlError: boolean;
  setCtx: SetProjectRequirements;
  setSelectedFile: (file: File | null) => void;
}) {
  if (activeSection === null) return null;

  return (
    <>
      <SectionStatusMessage assessmentId={assessmentId} loading={loading} />
      <Box sx={{ display: 'grid', gap: 3, opacity: loading ? 0.6 : 1, pointerEvents: loading ? 'none' : 'auto' }}>
        <ActiveSectionContent
          activeSection={activeSection}
          assessmentId={assessmentId}
          ctx={ctx}
          loading={loading}
          openableUrl={openableUrl}
          websiteUrlError={websiteUrlError}
          setCtx={setCtx}
          setSelectedFile={setSelectedFile}
        />
      </Box>
    </>
  );
}
