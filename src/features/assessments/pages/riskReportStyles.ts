import type { SxProps, Theme } from '@mui/material/styles';

export const riskReportInsetSx = {
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 2,
  px: 2,
  py: 1.25,
  bgcolor: 'surface.inset',
} satisfies SxProps<Theme>;

export const riskReportSectionSx = {
  display: 'flex',
  flexDirection: 'column',
  gap: 1.5,
  p: 2.5,
  ...riskReportInsetSx,
} satisfies SxProps<Theme>;
