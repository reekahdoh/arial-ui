import {
  Alert,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { AppCard } from '../../../components/ui/AppCard';
import { PageHeader } from '../../../components/ui/PageHeader';
import {
  buildBackendAssessmentUrl,
  fetchBackendAssessmentById,
} from '../../../services/assessments/backendAssessments';

type RiskReportPayload = {
  assessmentId: string;
  completedAt: string;
  response: unknown;
  raw: string;
};

type LocationState = {
  assessmentId?: unknown;
  report?: unknown;
};

type ReportDocument = {
  id?: unknown;
  name?: unknown;
  description?: unknown;
  requirement_summary?: unknown;
  scope?: unknown;
  risk_assessment?: unknown;
};

type RiskDetail = {
  key: string;
  name: string;
  description: string | null;
};

type HighRiskSummary = {
  key: string;
  name: string;
  description: string | null;
  impact: string | null;
  likelihood: string | null;
  risks: RiskDetail[];
};

type OverallRiskAssessment = {
  key: string;
  name: string;
  description: string | null;
  impact: string | null;
  likelihood: string | null;
};

type ReportSource = {
  document: ReportDocument | null;
  completedAt: string | null;
  error: string | null;
  isLoading: boolean;
};

function stringFromUnknown(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number') return String(value);
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeAssessmentLevel(value: unknown): string | null {
  const text = stringFromUnknown(value);
  return text ? text.toUpperCase() : null;
}

function directChildText(element: Element, names: string[]): string | null {
  for (const name of names) {
    const child = Array.from(element.children).find(
      (candidate) => candidate.tagName.toLowerCase() === name.toLowerCase(),
    );
    const text = child?.textContent?.trim();
    if (text) return text;
  }

  return null;
}

function xmlChildrenByTagName(element: Element, names: string[]): Element[] {
  return Array.from(element.children).filter((child) =>
    names.some((name) => child.tagName.toLowerCase() === name.toLowerCase()),
  );
}

function parseXmlReport(raw: string): ReportDocument | null {
  const xml = new DOMParser().parseFromString(raw, 'application/xml');
  if (xml.querySelector('parsererror')) return null;

  const root = xml.documentElement;
  const scope: Record<string, unknown> = {};
  const riskAssessment: Record<string, unknown> = {};
  const scopeRoot = xmlChildrenByTagName(root, ['scope'])[0];
  const riskAssessmentRoot = xmlChildrenByTagName(root, ['risk_assessment', 'riskAssessment'])[0];

  if (scopeRoot) {
    for (const scopeEntry of Array.from(scopeRoot.children)) {
      const key = scopeEntry.getAttribute('key') ?? scopeEntry.tagName;
      const risksRoot = xmlChildrenByTagName(scopeEntry, ['risks'])[0];
      const risks: Record<string, unknown> = {};

      if (risksRoot) {
        for (const riskEntry of Array.from(risksRoot.children)) {
          const riskKey = riskEntry.getAttribute('key') ?? riskEntry.tagName;
          risks[riskKey] = {
            name: directChildText(riskEntry, ['name']),
            description: directChildText(riskEntry, ['description']),
          };
        }
      }

      scope[key] = {
        name: directChildText(scopeEntry, ['name']),
        description: directChildText(scopeEntry, ['description']),
        likelihood: directChildText(scopeEntry, ['likelihood']),
        status: directChildText(scopeEntry, ['status']),
        risks,
      };
    }
  }

  if (riskAssessmentRoot) {
    for (const scopeEntry of Array.from(riskAssessmentRoot.children)) {
      const scopeKey = scopeEntry.getAttribute('key') ?? scopeEntry.tagName;
      const risks: Record<string, unknown> = {};

      for (const riskEntry of Array.from(scopeEntry.children)) {
        const riskKey = riskEntry.getAttribute('key') ?? riskEntry.tagName;
        const riskNode = xmlChildrenByTagName(riskEntry, ['risk'])[0] ?? riskEntry;
        risks[riskKey] = {
          risk: {
            name: directChildText(riskNode, ['name']),
            description: directChildText(riskNode, ['description']),
          },
          impact: directChildText(riskEntry, ['impact']),
          likelihood: directChildText(riskEntry, ['likelihood']),
          status: directChildText(riskEntry, ['status']),
        };
      }

      riskAssessment[scopeKey] = risks;
    }
  }

  return {
    id: directChildText(root, ['id']),
    name: directChildText(root, ['name']),
    description: directChildText(root, ['description']),
    requirement_summary: directChildText(root, [
      'requirement_summary',
      'requirementSummary',
      'requirement-summary',
    ]),
    scope,
    risk_assessment: riskAssessment,
  };
}

function parseRawReport(raw: string): ReportDocument | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return parseXmlReport(raw);
  }
}

function looksLikeReportDocument(value: unknown): value is ReportDocument {
  return (
    isRecord(value) &&
    ('risk_assessment' in value ||
      'scope' in value ||
      'name' in value ||
      'requirement_summary' in value)
  );
}

function completedAtFromAssessmentPayload(data: unknown): string | null {
  if (!isRecord(data)) return null;
  return (
    stringFromUnknown(data.completed_at) ??
    stringFromUnknown(data.completedAt) ??
    stringFromUnknown(data.updated_at) ??
    stringFromUnknown(data.updatedAt)
  );
}

function reportDocumentFromAssessmentPayload(data: unknown, raw: string): ReportDocument | null {
  const fromRaw = parseRawReport(raw);
  if (fromRaw && looksLikeReportDocument(fromRaw)) return fromRaw;

  if (isRecord(data)) {
    const nestedKeys = ['report', 'risk_report', 'riskReport', 'result', 'payload', 'body'];
    for (const key of nestedKeys) {
      const nested = data[key];
      if (typeof nested === 'string') {
        const doc = parseRawReport(nested);
        if (doc && looksLikeReportDocument(doc)) return doc;
      }
      if (looksLikeReportDocument(nested)) return nested as ReportDocument;
    }
    if (looksLikeReportDocument(data)) return data as ReportDocument;
  }

  return fromRaw && isRecord(fromRaw) ? fromRaw : null;
}

async function fetchBackendAssessmentWithBetterNetworkError(
  assessmentId: string,
  signal: AbortSignal,
) {
  try {
    return await fetchBackendAssessmentById(assessmentId, signal);
  } catch (err) {
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      throw new Error(
        `Failed to fetch "${buildBackendAssessmentUrl(assessmentId)}" (network/CORS). In dev, ensure the proxy is running and restart npm start after proxy changes.`,
      );
    }
    throw err;
  }
}

function getReportDocument(report: RiskReportPayload): ReportDocument | null {
  if (isRecord(report.response) && ('name' in report.response || 'risk_assessment' in report.response)) {
    return report.response;
  }

  return parseRawReport(report.raw);
}

function getScopeName(scope: unknown, scopeKey: string): string | null {
  if (!isRecord(scope)) return null;
  const scopeEntry = scope[scopeKey];
  if (!isRecord(scopeEntry)) return null;
  return stringFromUnknown(scopeEntry.name);
}

function getRiskDetailsFromRisks(risks: unknown): RiskDetail[] {
  if (!isRecord(risks)) return [];

  return Object.entries(risks).flatMap(([key, risk]) => {
    if (!isRecord(risk)) return [];

    return [
      {
        key,
        name: stringFromUnknown(risk.name) ?? key,
        description: stringFromUnknown(risk.description),
      },
    ];
  });
}

function getRiskSummaryFromEntry(
  key: string,
  entry: Record<string, unknown>,
  scopeName: string | null,
): HighRiskSummary {
  const risk = isRecord(entry.risk) ? entry.risk : null;
  const riskName = stringFromUnknown(risk?.name) ?? key;
  const name = scopeName ? `${scopeName}: ${riskName}` : riskName;

  return {
    key,
    name,
    description: stringFromUnknown(risk?.description),
    impact: normalizeAssessmentLevel(entry.impact),
    likelihood: normalizeAssessmentLevel(entry.likelihood),
    risks: [],
  };
}

function getOverallRiskAssessments(reportDocument: ReportDocument): OverallRiskAssessment[] {
  if (!isRecord(reportDocument.risk_assessment)) return [];

  const riskAssessments: OverallRiskAssessment[] = [];
  for (const [scopeKey, scopeRiskEntries] of Object.entries(reportDocument.risk_assessment)) {
    if (!isRecord(scopeRiskEntries)) continue;
    const scopeName = getScopeName(reportDocument.scope, scopeKey);

    for (const [riskKey, riskEntry] of Object.entries(scopeRiskEntries)) {
      if (!isRecord(riskEntry)) continue;
      const risk = isRecord(riskEntry.risk) ? riskEntry.risk : null;
      const riskName = stringFromUnknown(risk?.name) ?? riskKey;

      riskAssessments.push({
        key: `${scopeKey}:${riskKey}`,
        name: scopeName ? `${scopeName}: ${riskName}` : riskName,
        description: stringFromUnknown(risk?.description),
        impact: normalizeAssessmentLevel(riskEntry.impact),
        likelihood: normalizeAssessmentLevel(riskEntry.likelihood),
      });
    }
  }

  return riskAssessments;
}

function getHighRiskAssessments(reportDocument: ReportDocument): HighRiskSummary[] {
  if (!isRecord(reportDocument.risk_assessment)) return [];

  const highRisks: HighRiskSummary[] = [];
  for (const [scopeKey, scopeRiskEntries] of Object.entries(reportDocument.risk_assessment)) {
    if (!isRecord(scopeRiskEntries)) continue;
    const scopeName = getScopeName(reportDocument.scope, scopeKey);

    for (const [riskKey, riskEntry] of Object.entries(scopeRiskEntries)) {
      if (!isRecord(riskEntry)) continue;
      const impact = normalizeAssessmentLevel(riskEntry.impact);
      const likelihood = normalizeAssessmentLevel(riskEntry.likelihood);
      if (impact === 'HIGH' || likelihood === 'HIGH') {
        highRisks.push(getRiskSummaryFromEntry(riskKey, riskEntry, scopeName));
      }
    }
  }

  return highRisks;
}

function getScopeAssessmentsByLikelihood(
  reportDocument: ReportDocument,
  likelihoodLevel: string,
): HighRiskSummary[] {
  if (!isRecord(reportDocument.scope)) return [];

  return Object.entries(reportDocument.scope).flatMap(([key, value]) => {
    if (!isRecord(value) || normalizeAssessmentLevel(value.likelihood) !== likelihoodLevel) return [];

    return [
      {
        key,
        name: stringFromUnknown(value.name) ?? key,
        description: stringFromUnknown(value.description),
        impact: null,
        likelihood: likelihoodLevel,
        risks: getRiskDetailsFromRisks(value.risks),
      },
    ];
  });
}

function getHighestPriorityRisks(reportDocument: ReportDocument): HighRiskSummary[] {
  const highRiskAssessments = getHighRiskAssessments(reportDocument);
  return highRiskAssessments.length > 0
    ? highRiskAssessments
    : getScopeAssessmentsByLikelihood(reportDocument, 'HIGH');
}

function getRiskLevelCellSx(level: string | null) {
  if (level === 'HIGH') {
    return { bgcolor: 'error.main', color: 'error.contrastText', fontWeight: 700 };
  }
  if (level === 'MODERATE') {
    return { bgcolor: 'warning.main', color: 'warning.contrastText', fontWeight: 700 };
  }
  return { bgcolor: 'success.main', color: 'success.contrastText', fontWeight: 700 };
}

function getRiskReportStorageKey(assessmentId: string): string {
  return `risk-report:${assessmentId}`;
}

function isRiskReportPayload(value: unknown): value is RiskReportPayload {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.assessmentId === 'string' &&
    typeof record.completedAt === 'string' &&
    typeof record.raw === 'string'
  );
}

function readStoredRiskReport(assessmentId: string): RiskReportPayload | null {
  const stored = sessionStorage.getItem(getRiskReportStorageKey(assessmentId));
  if (!stored) return null;

  try {
    const parsed: unknown = JSON.parse(stored);
    return isRiskReportPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function RiskReportPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [apiReport, setApiReport] = useState<ReportSource>({
    document: null,
    completedAt: null,
    error: null,
    isLoading: false,
  });
  const locationState = location.state as LocationState | null;
  const assessmentId =
    stringFromUnknown(locationState?.assessmentId) ?? searchParams.get('assessmentId')?.trim() ?? '';
  const stateReport = locationState?.report;
  const reportFromState = isRiskReportPayload(stateReport) ? stateReport : null;
  const report = reportFromState ?? (assessmentId ? readStoredRiskReport(assessmentId) : null);
  const storedReportDocument = report ? getReportDocument(report) : null;
  const reportDocument = apiReport.document ?? storedReportDocument;
  const completedAt = apiReport.completedAt ?? report?.completedAt;
  const reportName = stringFromUnknown(reportDocument?.name) ?? 'this assessment';
  const reportDescription = stringFromUnknown(reportDocument?.description) ?? 'No description provided';
  const requirementSummary =
    stringFromUnknown(reportDocument?.requirement_summary) ?? 'the requirements in this assessment';
  const overallRiskAssessments = reportDocument ? getOverallRiskAssessments(reportDocument) : [];
  const highestPriorityRisks = reportDocument ? getHighestPriorityRisks(reportDocument) : [];
  const lowerPriorityRisks = reportDocument
    ? getScopeAssessmentsByLikelihood(reportDocument, 'LOW')
    : [];

  useEffect(() => {
    const trimmedId = assessmentId.trim();
    if (!trimmedId) {
      setApiReport({
        document: null,
        completedAt: null,
        error: null,
        isLoading: false,
      });
      return;
    }

    const controller = new AbortController();
    setApiReport((prev) => ({ ...prev, isLoading: true, error: null }));

    void (async () => {
      try {
        const result = await fetchBackendAssessmentWithBetterNetworkError(trimmedId, controller.signal);
        if (!result.ok) {
          throw new Error(`Assessment returned ${result.status}: ${result.raw || '(empty response)'}`);
        }

        const document = reportDocumentFromAssessmentPayload(result.data, result.raw);
        if (!document) {
          console.error('Risk report response could not be parsed.', {
            url: buildBackendAssessmentUrl(trimmedId),
            preview: result.raw.slice(0, 500),
          });
        }

        const completedAt =
          completedAtFromAssessmentPayload(result.data) ?? new Date().toISOString();

        if (controller.signal.aborted) return;

        setApiReport({
          document,
          completedAt,
          error: document ? null : 'Report response could not be parsed.',
          isLoading: false,
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (controller.signal.aborted) return;
        console.error('Risk report could not be loaded from API.', {
          url: buildBackendAssessmentUrl(trimmedId),
          error: err,
        });
        setApiReport({
          document: null,
          completedAt: null,
          error: err instanceof Error ? err.message : 'Report could not be loaded.',
          isLoading: false,
        });
      }
    })();

    return () => controller.abort();
  }, [assessmentId]);

  return (
    <>
      <PageHeader
        title="Your Risk Report"
        description="Here is your risk assessment."
        descriptionVariant="body1"
        descriptionSx={{ fontSize: '1rem', lineHeight: 1.45 }}
      />
      <AppCard>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
          {!assessmentId.trim() ? (
            <Alert severity="warning">
              No assessment was specified. Open this page from an assessment to view its risk report.
            </Alert>
          ) : !reportDocument && apiReport.isLoading ? (
            <Typography variant="body2" color="text.secondary">
              Loading report...
            </Typography>
          ) : !reportDocument ? (
            <Alert severity="warning">
              {apiReport.error ?? 'No completed risk report was found for this assessment.'}
            </Alert>
          ) : (
            <>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    px: 2,
                    py: 1.25,
                    bgcolor: 'surface.inset',
                  }}
                >
                  <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>
                    Name
                  </Typography>
                  <Typography variant="body1" sx={{ fontSize: '1.125rem', fontWeight: 700 }}>
                    {reportName}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    px: 2,
                    py: 1.25,
                    bgcolor: 'surface.inset',
                  }}
                >
                  <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>
                    Description
                  </Typography>
                  <Typography variant="body1" sx={{ fontSize: '1.125rem', fontWeight: 700 }}>
                    {reportDescription}
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  px: 2,
                  py: 1.25,
                  bgcolor: 'surface.inset',
                }}
              >
                <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>
                  Requirements
                </Typography>
                <Typography variant="body1" sx={{ fontSize: '1.125rem' }}>
                  {requirementSummary}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                  p: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  bgcolor: 'surface.inset',
                }}
              >
                <Typography variant="h6" component="h2">
                  Overall Risk Assessment
                </Typography>
                {overallRiskAssessments.length > 0 ? (
                  <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                    <Table size="small" aria-label="Overall risk assessment">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Impact</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Likelihood</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {overallRiskAssessments.map((risk) => (
                          <TableRow key={risk.key}>
                            <TableCell>{risk.name}</TableCell>
                            <TableCell>{risk.description ?? 'Not provided'}</TableCell>
                            <TableCell sx={getRiskLevelCellSx(risk.impact)}>
                              {risk.impact ?? 'UNKNOWN'}
                            </TableCell>
                            <TableCell sx={getRiskLevelCellSx(risk.likelihood)}>
                              {risk.likelihood ?? 'UNKNOWN'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No assessed risks were identified in this report.
                  </Typography>
                )}
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                  p: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  bgcolor: 'surface.inset',
                }}
              >
                <Typography variant="h6" component="h2">
                  Your highest priority risks are
                </Typography>
                {highestPriorityRisks.length > 0 ? (
                  <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                    {highestPriorityRisks.map((risk) => (
                      <Box component="li" key={risk.key} sx={{ mb: 1.5 }}>
                        <Typography variant="subtitle1" component="span" sx={{ fontWeight: 700 }}>
                          {risk.name}
                        </Typography>
                        {risk.description ? (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                            {risk.description}
                          </Typography>
                        ) : null}
                        {risk.risks.length > 0 ? (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              leading to
                            </Typography>
                            <Box component="ul" sx={{ m: 0, mt: 0.75, pl: 2.5 }}>
                              {risk.risks.map((riskDetail) => (
                                <Box component="li" key={riskDetail.key} sx={{ mb: 0.75 }}>
                                  <Typography variant="body2" component="span" sx={{ fontWeight: 700 }}>
                                    {riskDetail.name}
                                  </Typography>
                                  {riskDetail.description ? (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                                      {riskDetail.description}
                                    </Typography>
                                  ) : null}
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        ) : null}
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          {risk.impact ? `Impact: ${risk.impact}. ` : ''}
                          {risk.likelihood ? `Likelihood: ${risk.likelihood}.` : ''}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No high risks were identified in this report.
                  </Typography>
                )}
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                  p: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  bgcolor: 'surface.inset',
                }}
              >
                <Typography variant="h6" component="h2">
                  Your lower priority risks are
                </Typography>
                {lowerPriorityRisks.length > 0 ? (
                  <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
                    {lowerPriorityRisks.map((risk) => (
                      <Box component="li" key={risk.key} sx={{ mb: 1.5 }}>
                        <Typography variant="subtitle1" component="span" sx={{ fontWeight: 700 }}>
                          {risk.name}
                        </Typography>
                        {risk.description ? (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                            {risk.description}
                          </Typography>
                        ) : null}
                        {risk.risks.length > 0 ? (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              leading to
                            </Typography>
                            <Box component="ul" sx={{ m: 0, mt: 0.75, pl: 2.5 }}>
                              {risk.risks.map((riskDetail) => (
                                <Box component="li" key={riskDetail.key} sx={{ mb: 0.75 }}>
                                  <Typography variant="body2" component="span" sx={{ fontWeight: 700 }}>
                                    {riskDetail.name}
                                  </Typography>
                                  {riskDetail.description ? (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                                      {riskDetail.description}
                                    </Typography>
                                  ) : null}
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        ) : null}
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          {risk.likelihood ? `Likelihood: ${risk.likelihood}.` : ''}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No low risks were identified in this report.
                  </Typography>
                )}
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    px: 2,
                    py: 1.25,
                    bgcolor: 'surface.inset',
                  }}
                >
                  <Typography variant="overline" color="text.secondary" sx={{ display: 'block' }}>
                    Completed At
                  </Typography>
                  <Typography variant="body2">
                    {completedAt ? new Date(completedAt).toLocaleString() : 'Not available'}
                  </Typography>
                </Box>
              </Box>
            </>
          )}
        </Box>
      </AppCard>
    </>
  );
}
