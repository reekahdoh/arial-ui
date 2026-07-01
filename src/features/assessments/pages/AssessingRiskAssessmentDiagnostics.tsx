import { Alert, Box, Typography } from '@mui/material';
import { AssessmentDiagnosticsAccordion } from './AssessmentDiagnosticsAccordion';
import type { AssessmentRiskExchangeLogEntry } from './assessingRiskAssessmentApi';

function RequestStatus({ entry, index }: { entry: AssessmentRiskExchangeLogEntry; index: number }) {
  if (entry.response) {
    return <>Request {index + 1} · HTTP {entry.response.httpStatus}{entry.response.ok ? '' : ' (error)'}</>;
  }
  if (entry.error) return <>Request {index + 1} · failed</>;
  return <>Request {index + 1} · awaiting response</>;
}

function RequestLogEntry({
  entry,
  index,
  isLast,
}: {
  entry: AssessmentRiskExchangeLogEntry;
  index: number;
  isLast: boolean;
}) {
  return (
    <Box sx={{ mb: isLast ? 0 : 2 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
        <RequestStatus entry={entry} index={index} />
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, mb: 0.25 }}>
        {entry.request.method} URL (browser fetch target)
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        component="pre"
        sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', m: 0, mb: 1, wordBreak: 'break-all' }}
      >
        {entry.request.url}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, mb: 0.25 }}>
        Request body{entry.request.method === 'POST' ? ' (JSON POST body)' : ''}
      </Typography>
      <Typography
        variant="caption"
        color="text.secondary"
        component="pre"
        sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', m: 0, mb: 1, wordBreak: 'break-word' }}
      >
        {entry.request.bodySummary}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600, mb: 0.25 }}>
        Response JSON
      </Typography>
      {entry.response ? (
        <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', m: 0 }}>
          {entry.response.json || entry.response.raw || '(empty body)'}
        </Typography>
      ) : (
        <Typography variant="caption" color="text.secondary">
          Waiting for response...
        </Typography>
      )}
      {entry.error ? (
        <Alert severity="error" sx={{ mt: 1 }}>
          {entry.error}
        </Alert>
      ) : null}
    </Box>
  );
}

function RiskExchangeLog({ riskExchangeLog }: { riskExchangeLog: AssessmentRiskExchangeLogEntry[] }) {
  if (riskExchangeLog.length === 0) {
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
        assessment answer requests and responses
      </Typography>
      {riskExchangeLog.map((entry, index, arr) => (
        <RequestLogEntry key={entry.key} entry={entry} index={index} isLast={index === arr.length - 1} />
      ))}
    </Box>
  );
}

export function AssessingRiskAssessmentDiagnostics({
  assessmentId,
  riskExchangeLog,
}: {
  assessmentId: string;
  riskExchangeLog: AssessmentRiskExchangeLogEntry[];
}) {
  return (
    <AssessmentDiagnosticsAccordion assessmentId={assessmentId}>
      <RiskExchangeLog riskExchangeLog={riskExchangeLog} />
    </AssessmentDiagnosticsAccordion>
  );
}
