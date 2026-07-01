import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import type { OverallRiskAssessment } from './riskReportTypes';

export function RiskReportAssessmentDialog({
  risk,
  onClose,
}: {
  risk: OverallRiskAssessment | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={Boolean(risk)} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Risk Assessment</DialogTitle>
      <DialogContent>
        {risk ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
            <Box>
              <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>
                Risk Name
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700 }}>
                {risk.name}
              </Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
              <Box>
                <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>
                  Impact
                </Typography>
                <Typography variant="body1">{risk.impact ?? 'UNKNOWN'}</Typography>
              </Box>
              <Box>
                <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>
                  Likelihood
                </Typography>
                <Typography variant="body1">{risk.likelihood ?? 'UNKNOWN'}</Typography>
              </Box>
            </Box>
            <Box>
              <Typography variant="h6" component="h3">
                Rationale
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {risk.rationale ?? 'No rationale was provided for this risk.'}
              </Typography>
            </Box>
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
