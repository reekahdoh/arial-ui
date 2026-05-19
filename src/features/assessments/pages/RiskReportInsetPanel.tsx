import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { riskReportInsetSx } from './riskReportStyles';

export function RiskReportInsetPanel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box sx={riskReportInsetSx}>
      <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>
        {label}
      </Typography>
      {children}
    </Box>
  );
}
