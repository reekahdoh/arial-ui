import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';

export function ProjectRequirementsViewDialog({
  open,
  onClose,
  displayLabel,
  reading,
  error,
  text,
}: {
  open: boolean;
  onClose: () => void;
  displayLabel: string | null;
  reading: boolean;
  error: string | null;
  text: string | null;
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Project Requirements File</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'grid', gap: 1.5, pt: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            {displayLabel ?? 'Selected file'}
          </Typography>
          {reading ? (
            <Typography variant="body2" color="text.secondary">
              Reading file…
            </Typography>
          ) : error ? (
            <Alert severity="warning">{error}</Alert>
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
              {text ?? ''}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
