import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

function AssessmentIdPanel({ assessmentId }: { assessmentId: string }) {
  if (!assessmentId) return null;

  return (
    <Box
      sx={{
        width: '100%',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        px: 2,
        py: 1.25,
        bgcolor: 'surface.inset',
      }}
    >
      <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>
        Assessment ID
      </Typography>
      <Typography variant="data" sx={{ wordBreak: 'break-all' }}>
        {assessmentId}
      </Typography>
    </Box>
  );
}

export function AssessmentDiagnosticsAccordion({
  assessmentId,
  children,
}: {
  assessmentId: string;
  children: ReactNode;
}) {
  return (
    <Accordion
      defaultExpanded={false}
      disableGutters
      sx={{
        width: '100%',
        '&:before': { display: 'none' },
        boxShadow: 'none',
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          px: 2,
          minHeight: 48,
          position: 'relative',
          '& .MuiAccordionSummary-content': { flexGrow: 1, justifyContent: 'center', margin: 0 },
          '& .MuiAccordionSummary-expandIconWrapper': {
            position: 'absolute',
            right: 8,
            top: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
          },
        }}
      >
        <Typography variant="subtitle2" component="span">
          Diagnostics
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 2, pt: 0, pb: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <AssessmentIdPanel assessmentId={assessmentId} />
          {children}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
}
