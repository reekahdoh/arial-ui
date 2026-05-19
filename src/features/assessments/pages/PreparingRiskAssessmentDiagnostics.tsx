import { Box, Typography } from '@mui/material';
import { AssessmentDiagnosticsAccordion } from './AssessmentDiagnosticsAccordion';
import type { AiIdResponseLogEntry } from './preparingRiskAssessmentApi';

function AiLogEntry({ entry, isLast }: { entry: AiIdResponseLogEntry; isLast: boolean }) {
  return (
    <Box sx={{ mb: isLast ? 0 : 2 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
        chat_stage: {entry.chatStage} · HTTP {entry.httpStatus}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, mb: 0.25 }}>
        POST URL (browser fetch target — proxy must forward here for the AI API)
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        component="pre"
        sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', m: 0, mb: 1, wordBreak: 'break-all' }}
      >
        {entry.requestUrl}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, mb: 0.25 }}>
        Request body (JSON POST body)
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        component="pre"
        sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', m: 0, mb: 1, wordBreak: 'break-word' }}
      >
        {entry.requestBodyJson}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, mb: 0.25 }}>
        Response JSON
      </Typography>
      <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', m: 0 }}>
        {entry.responseJson}
      </Typography>
    </Box>
  );
}

function AiExchangeLog({ entries }: { entries: AiIdResponseLogEntry[] }) {
  if (entries.length === 0) {
    return (
      <Typography variant="caption" color="text.secondary">
        API request/response details will appear here after the assessment service responds.
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'action.hover',
      }}
    >
      <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        assessment ai responses (identifying-ais / identified-ais)
      </Typography>
      {entries.map((entry, index, arr) => (
        <AiLogEntry key={entry.key} entry={entry} isLast={index === arr.length - 1} />
      ))}
    </Box>
  );
}

export function PreparingRiskAssessmentDiagnostics({
  assessmentId,
  aiIdResponseLog,
}: {
  assessmentId: string;
  aiIdResponseLog: AiIdResponseLogEntry[];
}) {
  return (
    <AssessmentDiagnosticsAccordion assessmentId={assessmentId}>
      <AiExchangeLog entries={aiIdResponseLog} />
    </AssessmentDiagnosticsAccordion>
  );
}
