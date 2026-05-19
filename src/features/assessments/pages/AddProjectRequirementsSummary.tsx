import { Add, EmailOutlined, InsertDriveFileOutlined, LanguageOutlined, TextFields } from '@mui/icons-material';
import {
  Alert,
  Box,
  ButtonBase,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { AppCTAButton, AppCTAButtonLink } from '../../../components/ui/AppCTAButton';
import { appCtaButtonTrackSx } from '../../../theme/tokens';
import type { ContextSectionId, SupportingContextRow } from './addProjectRequirementsHelpers';

const CONTEXT_TYPE_TILES: ReadonlyArray<{
  id: ContextSectionId;
  label: string;
  Icon: typeof InsertDriveFileOutlined;
}> = [
  { id: 'document', label: 'Document', Icon: InsertDriveFileOutlined },
  { id: 'website', label: 'Website', Icon: LanguageOutlined },
  { id: 'email', label: 'Email', Icon: EmailOutlined },
  { id: 'text', label: 'Text', Icon: TextFields },
];

export function HeaderActions({
  backTo,
  canSave,
  isDirty,
  saving,
  onSave,
}: {
  backTo: string;
  canSave: boolean;
  isDirty: boolean;
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <>
      <AppCTAButtonLink to={backTo} variant="outlined" size="small" sx={{ py: 0.5 }}>
        Back
      </AppCTAButtonLink>
      <Box sx={appCtaButtonTrackSx}>
        <AppCTAButton variant={isDirty ? 'contained' : 'outlined'} fullWidth onClick={onSave} disabled={!canSave || saving}>
          {saving ? 'Saving…' : 'Save'}
        </AppCTAButton>
      </Box>
    </>
  );
}

export function FeedbackAlerts({
  loadError,
  persistError,
  persistInfo,
  clearPersistError,
  clearPersistInfo,
}: {
  loadError: string | null;
  persistError: string | null;
  persistInfo: string | null;
  clearPersistError: () => void;
  clearPersistInfo: () => void;
}) {
  return (
    <>
      {loadError ? <Alert severity="warning" sx={{ mb: 2 }}>{loadError}</Alert> : null}
      {persistError ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={clearPersistError}>
          {persistError}
        </Alert>
      ) : null}
      {persistInfo ? (
        <Alert severity="success" sx={{ mb: 2 }} onClose={clearPersistInfo}>
          {persistInfo}
        </Alert>
      ) : null}
    </>
  );
}

export function SupportingContextTable({ rows }: { rows: SupportingContextRow[] }) {
  if (rows.length === 0) return null;

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" component="h2" sx={{ mb: 1.5, fontWeight: 600 }}>
        Supporting Context
      </Typography>
      <TableContainer
        sx={(theme) => ({
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: `${theme.shapeBorderRadius.sm}px`,
          bgcolor: 'surface.inset',
          boxShadow: theme.shadowsElevation.hairline,
        })}
      >
        <Table size="small" aria-label="Supporting context">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, width: 120 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell sx={{ verticalAlign: 'top', color: 'text.secondary', fontWeight: 600 }}>{row.type}</TableCell>
                <TableCell sx={{ wordBreak: 'break-word' }}>{row.details}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export function ContextTypeTiles({
  activeSection,
  setActiveSection,
}: {
  activeSection: ContextSectionId | null;
  setActiveSection: (section: ContextSectionId) => void;
}) {
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: { xs: 1.5, sm: 2 } }}>
        <Add aria-hidden sx={{ fontSize: { xs: 72, sm: 96 }, color: 'primary.main' }} />
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(4, minmax(0, 1fr))' }, gap: { xs: 1, sm: 2 } }}>
        {CONTEXT_TYPE_TILES.map(({ id, label, Icon }) => {
          const selected = activeSection === id;
          return (
            <ButtonBase
              key={id}
              type="button"
              disableRipple
              onClick={() => setActiveSection(id)}
              aria-pressed={selected}
              aria-label={`Show ${label} context`}
              sx={(theme) => ({
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1.25,
                py: { xs: 1.75, sm: 2.25 },
                px: { xs: 1, sm: 2 },
                width: '100%',
                borderRadius: `${theme.shapeBorderRadius.sm}px`,
                border: '1px solid',
                borderColor: selected ? 'primary.main' : 'divider',
                bgcolor: selected ? 'action.selected' : 'surface.inset',
                boxShadow: theme.shadowsElevation.hairline,
                transition: theme.transitions.create(['border-color', 'background-color'], { duration: theme.transitions.duration.shorter }),
                '&:hover': { bgcolor: selected ? 'action.selected' : 'action.hover' },
                '&.Mui-focusVisible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2 },
              })}
            >
              <Icon aria-hidden sx={{ fontSize: { xs: 40, sm: 56 }, color: 'grey.700', filter: 'grayscale(1)' }} />
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: undefined }, textAlign: 'center' }}>
                {label}
              </Typography>
            </ButtonBase>
          );
        })}
      </Box>
    </Box>
  );
}
