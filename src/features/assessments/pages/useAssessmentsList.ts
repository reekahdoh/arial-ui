import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { fetchBackendAssessmentById } from '../../../services/assessments/backendAssessments';
import { deleteRiskAssessmentAndAssociatedData } from '../../../services/assessments/deleteRiskAssessment';
import type { RiskAssessmentRead } from '../../../services/assessments/firestoreRiskAssessments';
import { listRiskAssessments } from '../../../services/assessments/firestoreRiskAssessments';
import {
  getAssessmentId,
  getAssessmentRiskImpact,
  getAssessmentRiskLikelihood,
  getAssessmentStatus,
  sortAssessments,
  type AssessmentStatusState,
} from './assessmentsListHelpers';

// Session-lived caches so revisiting the list renders the last-known data instantly
// (no loading flicker) while a background refresh reconciles.
let cachedRows: RiskAssessmentRead[] | null = null;
let cachedStatuses: Record<string, AssessmentStatusState> = {};

function useAssessmentBackendStatuses(
  rows: RiskAssessmentRead[],
  setStatusByRowId: Dispatch<SetStateAction<Record<string, AssessmentStatusState>>>,
) {
  useEffect(() => {
    const controller = new AbortController();
    const rowsWithAssessmentIds = rows
      .map((row) => ({ rowId: row.id, assessmentId: getAssessmentId(row) }))
      .filter((row) => row.assessmentId);

    setStatusByRowId((prev) =>
      Object.fromEntries(
        rows.map((row) => {
          const assessmentId = getAssessmentId(row);
          // Keep a previously resolved status visible while we silently refetch, so the
          // score/status columns don't flash back to "Loading…" on every revisit.
          const existing = prev[row.id];
          if (existing && !existing.isLoading && existing.assessmentId === (assessmentId || null)) {
            return [row.id, existing];
          }
          return [
            row.id,
            { status: null, riskImpact: null, riskLikelihood: null, assessmentId: assessmentId || null, isLoading: Boolean(assessmentId) },
          ];
        }),
      ),
    );

    rowsWithAssessmentIds.forEach(({ rowId, assessmentId }) => {
      void (async () => {
        try {
          const result = await fetchBackendAssessmentById(assessmentId, controller.signal);
          const status = getAssessmentStatus(result.data);
          const riskImpact = getAssessmentRiskImpact(result.data);
          const riskLikelihood = getAssessmentRiskLikelihood(result.data);
          if (controller.signal.aborted) return;
          setStatusByRowId((prev) => ({
            ...prev,
            [rowId]: { status, riskImpact, riskLikelihood, assessmentId, isLoading: false },
          }));
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') return;
          setStatusByRowId((prev) => ({
            ...prev,
            [rowId]: { status: null, riskImpact: null, riskLikelihood: null, assessmentId, isLoading: false },
          }));
        }
      })();
    });

    return () => controller.abort();
  }, [rows, setStatusByRowId]);
}

export function useAssessmentsList() {
  const [rows, setRows] = useState<RiskAssessmentRead[]>(() => cachedRows ?? []);
  // Only show the full loading state on the very first load; revisits render cached rows.
  const [loading, setLoading] = useState(() => cachedRows === null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deletingRowId, setDeletingRowId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [statusByRowId, setStatusByRowId] = useState<Record<string, AssessmentStatusState>>(() => cachedStatuses);

  const refreshRows = useCallback(async () => {
    if (cachedRows === null) setLoading(true);
    setLoadError(null);
    try {
      const next = sortAssessments(await listRiskAssessments());
      cachedRows = next;
      setRows(next);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load risk assessments.');
      if (cachedRows === null) setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshRows();
  }, [refreshRows]);

  useEffect(() => {
    cachedStatuses = statusByRowId;
  }, [statusByRowId]);

  const handleDelete = useCallback(
    async (row: RiskAssessmentRead) => {
      if (!window.confirm('Delete the selected Risk Assessment?')) return;

      setDeleteError(null);
      setDeletingRowId(row.id);
      setRows((current) => current.filter((entry) => entry.id !== row.id));
      setStatusByRowId((prev) => {
        const next = { ...prev };
        delete next[row.id];
        return next;
      });

      try {
        await deleteRiskAssessmentAndAssociatedData(row);
        await refreshRows();
      } catch (err) {
        await refreshRows();
        setDeleteError(err instanceof Error ? err.message : 'Failed to delete risk assessment.');
      } finally {
        setDeletingRowId(null);
      }
    },
    [refreshRows],
  );

  useAssessmentBackendStatuses(rows, setStatusByRowId);

  return {
    rows,
    loading,
    loadError,
    deleteError,
    deletingRowId,
    statusByRowId,
    setDeleteError,
    setLoadError,
    handleDelete,
  };
}
