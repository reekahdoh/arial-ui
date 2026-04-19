import { Chip, type ChipProps } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  type RiskSeverity,
  type WorkflowStatus,
  riskSeverityColor,
  riskSeverityLabels,
  workflowStatusColor,
  workflowStatusLabels,
} from '../../constants/riskStatus';

export type StatusChipKind = 'severity' | 'workflow';

export interface StatusChipProps extends Omit<ChipProps, 'label' | 'color'> {
  kind: StatusChipKind;
  value: RiskSeverity | WorkflowStatus;
}

/**
 * Single entry point for status / severity chips — colors and labels come from
 * centralized mappings + theme tokens (no duplicated chip logic in tables).
 */
export function StatusChip({ kind, value, size = 'small', sx, ...rest }: StatusChipProps) {
  const theme = useTheme();

  const label =
    kind === 'severity'
      ? riskSeverityLabels[value as RiskSeverity]
      : workflowStatusLabels[value as WorkflowStatus];

  const backgroundColor =
    kind === 'severity'
      ? riskSeverityColor(theme, value as RiskSeverity)
      : workflowStatusColor(theme, value as WorkflowStatus);

  return (
    <Chip
      label={label}
      size={size}
      variant="filled"
      sx={[
        {
          fontWeight: 600,
          letterSpacing: '0.01em',
          backgroundColor,
          color: theme.palette.getContrastText(backgroundColor),
          '& .MuiChip-label': { px: 1 },
          ...(kind === 'severity'
            ? {
                width: theme.spacing(13),
                justifyContent: 'center',
                '& .MuiChip-label': { px: 1, textAlign: 'center', width: '100%' },
              }
            : {}),
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...rest}
    />
  );
}
