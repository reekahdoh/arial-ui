import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { fetchBackendAssessmentById } from '../../../services/assessments/backendAssessments';
import { deleteRiskAssessmentAndAssociatedData } from '../../../services/assessments/deleteRiskAssessment';
import type { RiskAssessmentRead } from '../../../services/assessments/firestoreRiskAssessments';
import { listRiskAssessments } from '../../../services/assessments/firestoreRiskAssessments';
import {
  getAssessmentId,
  getAssessmentStatus,
  sortAssessments,
  type AssessmentStatusState,
} from './assessmentsListHelpers';

function useAssessmentBackendStatuses(
  rows: RiskAssessmentRead[],
  setStatusByRowId: Dispatch<SetStateAction<Record<string, AssessmentStatusState>>>,
) {
  useEffect(() => {
    const controller = new AbortController();
    const rowsWithAssessmentIds = rows
      .map((row) => ({ rowId: row.id, assessmentId: getAssessmentId(row) }))
      .filter((row) => row.assessmentId);

    setStatusByRowId(
      Object.fromEntries(
        rows.map((row) => {
          const assessmentId = getAssessmentId(row);
          return [row.id, { status: null, assessmentId: assessmentId || null, isLoading: Boolean(assessmentId) }];
        }),
      ),
    );

    rowsWithAssessmentIds.forEach(({ rowId, assessmentId }) => {
      void (async () => {
        try {
          const result = await fetchBackendAssessmentById(assessmentId, controller.signal);
          const status = getAssessmentStatus(result.data);
          if (controller.signal.aborted) return;
          setStatusByRowId((prev) => ({
            ...prev,
            [rowId]: { status, assessmentId, isLoading: false },
          }));
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') return;
          setStatusByRowId((prev) => ({
            ...prev,
            [rowId]: { status: null, assessmentId, isLoading: false },
          }));
        }
      })();
    });

    return () => controller.abort();
  }, [rows, setStatusByRowId]);
}

export function useAssessmentsList() {
  const [rows, setRows] = useState<RiskAssessmentRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deletingRowId, setDeletingRowId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [statusByRowId, setStatusByRowId] = useState<Record<string, AssessmentStatusState>>({});

  const refreshRows = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setRows(sortAssessments(await listRiskAssessments()));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load risk assessments.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshRows();
  }, [refreshRows]);

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
