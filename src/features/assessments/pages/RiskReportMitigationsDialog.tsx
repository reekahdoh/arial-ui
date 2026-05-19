import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import type { OverallRiskAssessment } from './riskReportTypes';

export function RiskReportMitigationsDialog({
  risk,
  onClose,
}: {
  risk: OverallRiskAssessment | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={Boolean(risk)} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Risk Mitigations</DialogTitle>
      <DialogContent>
        {risk ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 0.5 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
              <Box>
                <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>
                  Risk Name
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                  {risk.name}
                </Typography>
              </Box>
              <Box>
                <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>
                  Description
                </Typography>
                <Typography variant="body1">{risk.description ?? 'Not provided'}</Typography>
              </Box>
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
                Mitigations
              </Typography>
              {risk.mitigations.length > 0 ? (
                <Box component="ul" sx={{ m: 0, mt: 1, pl: 2.5 }}>
                  {risk.mitigations.map((mitigation, index) => (
                    <Box component="li" key={`${risk.key}:${index}`} sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {mitigation}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  No mitigations were provided for this risk.
                </Typography>
              )}
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
