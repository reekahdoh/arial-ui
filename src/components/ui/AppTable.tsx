import { Paper, Table, TableContainer, type TableProps } from '@mui/material';
import type { ReactNode } from 'react';

export interface AppTableProps {
  children: ReactNode;
  'aria-label'?: string;
  'data-testid'?: string;
  tableProps?: TableProps;
  /** Render square corners instead of the default rounded ones. */
  square?: boolean;
}

/**
 * Shared table chrome so feature pages do not re-specify borders, radius, or density.
 */
export function AppTable({
  children,
  'aria-label': ariaLabel,
  'data-testid': testId,
  tableProps,
  square = false,
}: AppTableProps) {
  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      elevation={0}
      data-testid={testId}
      sx={(theme) => ({
        /** Match `AppCard` / `RiskAssessmentOvalSection` — list page nested table used to use `md` and looked rounder than the form page. */
        borderRadius: square ? 0 : theme.shapeBorderRadius.sm,
        borderColor: theme.palette.border.subtle,
        boxShadow: theme.shadowsElevation.none,
        maxWidth: '100%',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
      })}
    >
      <Table size="small" stickyHeader aria-label={ariaLabel} {...tableProps}>
        {children}
      </Table>
    </TableContainer>
  );
}
