import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  buildBackendAssessmentReportUrl,
  fetchBackendAssessmentReport,
  generateBackendAssessmentReport,
} from '../../../services/assessments/backendAssessments';
import { resolveAuthenticatedUsername } from '../../../services/auth/resolveAuthenticatedUsername';
import { isAbortError } from './assessmentPageShared';
import type { DetailedReportState } from './riskReportTypes';

const emptyDetailedReport: DetailedReportState = {
  error: null,
  hasReport: false,
  isChecking: false,
  isGenerating: false,
  success: null,
  viewUrl: null,
};

export function useRiskReportDetailedReport(assessmentId: string, user: User | null, authLoading: boolean) {
  const [detailedReport, setDetailedReport] = useState<DetailedReportState>(emptyDetailedReport);

  useEffect(() => {
    const trimmedId = assessmentId.trim();
    if (!trimmedId || authLoading || !user) {
      setDetailedReport((prev) => ({ ...prev, hasReport: false, isChecking: false, success: null, viewUrl: null }));
      return;
    }

    const controller = new AbortController();
    let cancelled = false;
    setDetailedReport((prev) => ({ ...prev, error: null, hasReport: false, isChecking: true, success: null, viewUrl: null }));

    void (async () => {
      try {
        const userId = await resolveAuthenticatedUsername(user);
        if (cancelled) return;

        const result = await fetchBackendAssessmentReport(trimmedId, { userId }, controller.signal);
        const hasReport = result.ok && Boolean(result.raw || result.data);
        if (cancelled || controller.signal.aborted) return;

        setDetailedReport((prev) => ({
          ...prev,
          hasReport,
          isChecking: false,
          viewUrl: hasReport ? buildBackendAssessmentReportUrl(trimmedId, userId) : null,
        }));
      } catch (err) {
        if (isAbortError(err) || cancelled || controller.signal.aborted) return;
        setDetailedReport((prev) => ({ ...prev, hasReport: false, isChecking: false, viewUrl: null }));
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [assessmentId, authLoading, user]);

  const generateDetailedReport = async () => {
    const trimmedId = assessmentId.trim();
    if (!trimmedId) {
      setDetailedReport({ ...emptyDetailedReport, error: 'Cannot generate a detailed report: missing assessment id.' });
      return;
    }
    if (!user) {
      setDetailedReport({ ...emptyDetailedReport, error: 'Cannot generate a detailed report: missing authenticated user.' });
      return;
    }

    const controller = new AbortController();
    setDetailedReport((prev) => ({ ...prev, error: null, isGenerating: true, success: null }));

    try {
      const userId = await resolveAuthenticatedUsername(user);
      const result = await generateBackendAssessmentReport(trimmedId, { userId }, controller.signal);
      if (!result.ok) {
        throw new Error(`Detailed report returned ${result.status}: ${result.raw || '(empty response)'}`);
      }

      setDetailedReport({
        error: null,
        hasReport: true,
        isChecking: false,
        isGenerating: false,
        success: 'Detailed report generated.',
        viewUrl: buildBackendAssessmentReportUrl(trimmedId, userId),
      });
    } catch (err) {
      console.error('Detailed report could not be generated.', { assessmentId: trimmedId, error: err });
      setDetailedReport((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Detailed report could not be generated.',
        isGenerating: false,
        success: null,
      }));
    }
  };

  const viewDetailedReport = () => {
    if (detailedReport.viewUrl) window.open(detailedReport.viewUrl, '_blank', 'noopener,noreferrer');
  };

  return { detailedReport, generateDetailedReport, viewDetailedReport };
}
