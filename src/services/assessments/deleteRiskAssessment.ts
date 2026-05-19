import { deleteCustomerDomainReferencesByAssessment } from '../domains/firestoreCustomerDomainReferences';
import { deleteRiskAssessment, type RiskAssessmentRead } from './firestoreRiskAssessments';

const WIZARD_STORAGE_PREFIX = 'aira.riskAssessmentWizard.';

function riskReportStorageKey(assessmentId: string): string {
  return `risk-report:${assessmentId}`;
}

function clearWizardDraft(assessmentId: string): void {
  localStorage.removeItem(`${WIZARD_STORAGE_PREFIX}${assessmentId}`);
}

function collectAssessmentIds(record: RiskAssessmentRead): string[] {
  const ids = new Set<string>();
  const rowId = record.id.trim();
  const backendId = record.backendAssessmentId?.trim() ?? '';
  if (rowId) ids.add(rowId);
  if (backendId) ids.add(backendId);
  return [...ids];
}

/** Removes a risk assessment and Firestore data associated with it. */
export async function deleteRiskAssessmentAndAssociatedData(record: RiskAssessmentRead): Promise<void> {
  const assessmentIds = collectAssessmentIds(record);

  for (const id of assessmentIds) {
    clearWizardDraft(id);
    sessionStorage.removeItem(riskReportStorageKey(id));
  }

  await Promise.all(
    assessmentIds.map(async (id) => {
      try {
        await deleteCustomerDomainReferencesByAssessment(id);
        await deleteRiskAssessment(id);
      } catch {
        // Firestore docs may not exist for every legacy id; continue cleanup.
      }
    }),
  );
}
