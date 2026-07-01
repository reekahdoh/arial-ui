import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { buildBackendAssessmentUrl } from '../../../services/assessments/backendAssessments';
import { isAbortError, useAssessmentIdFromRoute } from './assessmentPageShared';
import { fetchBackendAssessmentWithBetterNetworkError } from './riskReportApi';
import {
  completedAtFromAssessmentPayload,
  getReportDocument,
  reportDocumentFromAssessmentPayload,
} from './riskReportParsing';
import { readStoredRiskReport } from './riskReportStorage';
import type { LocationState, OverallRiskAssessment, ReportSource, RiskReportPayload } from './riskReportTypes';
import { buildRiskReportViewModel } from './riskReportViewModel';
import { useRiskReportDetailedReport } from './useRiskReportDetailedReport';

function isRiskReportPayload(value: unknown): value is RiskReportPayload {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.assessmentId === 'string' &&
    typeof record.completedAt === 'string' &&
    typeof record.raw === 'string'
  );
}

export function useRiskReportPage() {
  const location = useLocation();
  const assessmentId = useAssessmentIdFromRoute();
  const { user, loading: authLoading } = useAuth();

  const [apiReport, setApiReport] = useState<ReportSource>({
    document: null,
    completedAt: null,
    error: null,
    isLoading: false,
  });
  const [selectedMitigationRisk, setSelectedMitigationRisk] = useState<OverallRiskAssessment | null>(null);
  const [selectedAssessmentRisk, setSelectedAssessmentRisk] = useState<OverallRiskAssessment | null>(null);

  const locationState = location.state as LocationState | null;
  const reportFromState =
    locationState && isRiskReportPayload(locationState.report) ? locationState.report : null;
  const storedReport = assessmentId ? readStoredRiskReport(assessmentId) : null;
  const report = reportFromState ?? storedReport;
  const storedReportDocument = report ? getReportDocument(report) : null;
  const reportDocument = apiReport.document ?? storedReportDocument;
  const completedAt = apiReport.completedAt ?? report?.completedAt ?? null;

  const viewModel = useMemo(
    () => buildRiskReportViewModel(reportDocument, completedAt),
    [reportDocument, completedAt],
  );

  const { detailedReport, generateDetailedReport, viewDetailedReport } = useRiskReportDetailedReport(
    assessmentId,
    user,
    authLoading,
  );

  useEffect(() => {
    const trimmedId = assessmentId.trim();
    if (!trimmedId) {
      setApiReport({ document: null, completedAt: null, error: null, isLoading: false });
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

        if (controller.signal.aborted) return;
        setApiReport({
          document,
          completedAt: completedAtFromAssessmentPayload(result.data) ?? new Date().toISOString(),
          error: document ? null : 'Report response could not be parsed.',
          isLoading: false,
        });
      } catch (err) {
        if (isAbortError(err) || controller.signal.aborted) return;
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

  return {
    assessmentId,
    authLoading,
    apiReport,
    detailedReport,
    viewModel,
    selectedMitigationRisk,
    setSelectedMitigationRisk,
    selectedAssessmentRisk,
    setSelectedAssessmentRisk,
    generateDetailedReport,
    viewDetailedReport,
  };
}
