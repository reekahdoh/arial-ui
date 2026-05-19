import { useEffect, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { fetchRequirementsDocumentContent } from '../../../services/assessments/backendRequirementsDocuments';
import { resolveBackendAssessmentId } from '../../../services/assessments/firestoreRiskAssessments';

export function useProjectRequirementsFileView({
  assessmentId,
  preferredFileName,
}: {
  assessmentId: string;
  preferredFileName: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [displayLabel, setDisplayLabel] = useState<string | null>(preferredFileName);
  const [backendAssessmentId, setBackendAssessmentId] = useState(assessmentId);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const resolved = await resolveBackendAssessmentId(assessmentId);
      if (!cancelled) setBackendAssessmentId(resolved);
    })();
    return () => {
      cancelled = true;
    };
  }, [assessmentId]);

  const viewFile = async (event: MouseEvent | KeyboardEvent) => {
    event.preventDefault();
    event.stopPropagation();

    setOpen(true);
    setText(null);
    setError(null);
    setDisplayLabel(preferredFileName);
    setReading(true);

    try {
      const result = await fetchRequirementsDocumentContent(backendAssessmentId, { preferredFileName });
      setText(result.content);
      setDisplayLabel(result.displayName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load the requirements document.');
    } finally {
      setReading(false);
    }
  };

  return {
    open,
    setOpen,
    text,
    error,
    reading,
    viewFile,
    displayLabel,
  };
}
