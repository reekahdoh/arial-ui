import {
  Alert,
  Box,
  Button,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useParams, useSearchParams } from 'react-router-dom';
import { AppCard } from '../../../components/ui/AppCard';
import { AppCTAButtonLink } from '../../../components/ui/AppCTAButton';
import { AppTable } from '../../../components/ui/AppTable';
import { PageHeader } from '../../../components/ui/PageHeader';
import { appCtaButtonTrackSx } from '../../../theme/tokens';
import { readCustomerDomainReferences } from '../customerDomainReferencesStorage';

type DomainKey = 'ai' | 'who';

function isDomainKey(value: unknown): value is DomainKey {
  return value === 'ai' || value === 'who';
}

export function CustomerDomainPage() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const domain = useMemo(() => (isDomainKey(params.domainKey) ? params.domainKey : null), [params.domainKey]);
  const assessmentId = searchParams.get('assessmentId') ?? '';
  const referenceScope = assessmentId || domain || 'default';
  const backTo = assessmentId
    ? `/assessments/new?assessmentId=${encodeURIComponent(assessmentId)}`
    : '/assessments/new';

  const [refs, setRefs] = useState<{ id: string; kind: 'website' | 'document'; value: string; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setLoadError(null);
    setLoading(true);
    try {
      setRefs(readCustomerDomainReferences(referenceScope));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load customer references');
      setRefs([]);
    } finally {
      setLoading(false);
    }
  }, [referenceScope]);

  return (
    <>
      <PageHeader
        title="Customer Domain"
        description={
          <>
            A customer domain represents the customer-specific area of activity and assets where related risks are
            grouped and evaluated together.
            <br />
            <br />
            Here you can view and edit the key customer references that will shape your customer domain.
            <br />
            <br />
            A well crafted customer domain is essential to define your risk governance approach for systems you are
            building yourself, or procuring.
          </>
        }
        actions={
          <>
            <Button component={RouterLink} to={backTo} variant="outlined" size="small">
              Back
            </Button>
            <Box sx={appCtaButtonTrackSx}>
              <AppCTAButtonLink
                variant="contained"
                fullWidth
                to={
                  assessmentId
                    ? `/customer-domain/references/new?assessmentId=${encodeURIComponent(assessmentId)}`
                    : domain
                      ? `/customer-domains/${domain}/references/new`
                      : '/customer-domain/references/new'
                }
              >
                Add Customer Reference
              </AppCTAButtonLink>
            </Box>
          </>
        }
      />

      <AppCard>
        <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>
          Customer References
        </Typography>

        {loadError ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {loadError}
          </Alert>
        ) : null}

        {refs.length ? (
          <AppTable aria-label="Customer References">
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
                    <Typography variant="data">{ref.kind === 'website' ? 'Website' : 'Document'}</Typography>
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
              {loading ? 'Loading…' : 'No customer references yet. Add a website URL or a document name.'}
            </Typography>
          </Box>
        )}
      </AppCard>
    </>
  );
}
