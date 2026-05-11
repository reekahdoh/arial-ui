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
import { isFirebaseConfigured } from '../../../services/firebase';
import { getDomainByRouteKey } from '../../../services/domains/firestoreDomains';
import {
  listAuthorativeReferencesByDomain,
} from '../../../services/authorativeReferences/firestoreAuthorativeReferences';
import { readDomainReferences } from '../domainReferencesStorage';

type DomainKey = 'ai' | 'who';

function isDomainKey(value: unknown): value is DomainKey {
  return value === 'ai' || value === 'who';
}

function domainLabel(domain: DomainKey): string {
  return domain === 'ai' ? 'AI' : 'WHO';
}

export function DomainPage() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const domain = useMemo(() => (isDomainKey(params.domainKey) ? params.domainKey : null), [params.domainKey]);
  const assessmentId = searchParams.get('assessmentId') ?? '';
  const backTo = assessmentId
    ? `/assessments/new?assessmentId=${encodeURIComponent(assessmentId)}`
    : '/assessments/new';

  const [refs, setRefs] = useState<{ id: string; kind: 'website' | 'document'; value: string; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [domainId, setDomainId] = useState<string | null>(null);

  useEffect(() => {
    if (!domain) return;
    let cancelled = false;

    const run = async () => {
      setLoadError(null);
      setLoading(true);
      try {
        if (isFirebaseConfigured()) {
          const d = await getDomainByRouteKey(domain);
          if (!d) {
            throw new Error(
              `Domain "${domainLabel(domain)}" not found in Firestore. Seed Domain documents with ids "ai" and "who" (see npm run seed:firestore), or add a domain whose document id is "${domain}".`,
            );
          }
          const list = await listAuthorativeReferencesByDomain(d.id);
          if (cancelled) return;
          setDomainId(d.id);
          setRefs(
            list.map((r) => ({
              id: r.id,
              kind: r.kind,
              value: r.value,
              createdAt: r.createdAt ?? '',
            })),
          );
        } else {
          setDomainId(null);
          setRefs(readDomainReferences(domain));
        }
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : 'Failed to load references');
        // fallback to local data if present
        setDomainId(null);
        setRefs(readDomainReferences(domain));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [domain]);

  if (!domain) {
    return (
      <>
        <PageHeader
          title="Authoritative Domain"
          description="Unknown domain. Please select a valid domain."
          actions={
            <Button component={RouterLink} to={backTo} variant="outlined" size="small">
              Back
            </Button>
          }
        />
        <AppCard>
          <Typography variant="body2" color="text.secondary">
            Choose a domain from the New Risk Assessment page.
          </Typography>
        </AppCard>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Authoritative Domain"
        description={
          isFirebaseConfigured() ? (
            <>
              A domain represents the area of activity and assets where related risks are grouped and evaluated
              together.
              <br />
              <br />
              Here you can view and edit the key authoritative references that will shape your domain.
              <br />
              <br />
              A well crafted domain is essential to define your risk governance approach for systems you are
              building yourself, or procuring.
            </>
          ) : (
            'Maintain reference sources for this domain. Stored locally until persistence is connected.'
          )
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
                    ? `/domains/${domain}/references/new?assessmentId=${encodeURIComponent(assessmentId)}`
                    : `/domains/${domain}/references/new`
                }
                state={{ domainId }}
              >
                Add Authoritative Reference
              </AppCTAButtonLink>
            </Box>
          </>
        }
      />

      <AppCard>
        <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>
          Authoritative References
        </Typography>

        {loadError ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {loadError}
          </Alert>
        ) : null}

        {refs.length ? (
          <AppTable aria-label="Authorative References">
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
              {loading ? 'Loading…' : 'No references yet. Add a website URL or a document name.'}
            </Typography>
          </Box>
        )}
      </AppCard>
    </>
  );
}

