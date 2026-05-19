import { Alert, Box, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { AppCard } from '../../components/ui/AppCard';
import { AppTable } from '../../components/ui/AppTable';
import { referenceKindLabel, type DomainReferenceRow } from './domainPageShared';

export function DomainReferencesListCard({
  sectionTitle,
  tableAriaLabel,
  emptyMessage,
  loading,
  loadError,
  refs,
}: {
  sectionTitle: string;
  tableAriaLabel: string;
  emptyMessage: string;
  loading: boolean;
  loadError: string | null;
  refs: DomainReferenceRow[];
}) {
  return (
    <AppCard>
      <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>
        {sectionTitle}
      </Typography>
      {loadError ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
      ) : null}
      {refs.length > 0 ? (
        <AppTable aria-label={tableAriaLabel}>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Reference</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {refs.map((ref) => (
              <TableRow key={ref.id} hover>
                <TableCell sx={{ width: 160 }}>
                  <Typography variant="data">{referenceKindLabel(ref.kind)}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="data">{ref.value}</Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </AppTable>
      ) : (
        <Box sx={{ py: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {loading ? 'Loading…' : emptyMessage}
          </Typography>
        </Box>
      )}
    </AppCard>
  );
}
