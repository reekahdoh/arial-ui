import { useMemo, useState } from 'react';
import type { ReferenceKind } from './domainReferencesStorage';
import { canSaveDomainReference, domainReferenceValue } from './domainReferenceFormShared';

export function useDomainReferenceForm(isReadyToSave: boolean) {
  const [kind, setKind] = useState<ReferenceKind>('document');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = useMemo(() => canSaveDomainReference(isReadyToSave, kind, url, file), [file, isReadyToSave, kind, url]);
  const referenceValue = useMemo(() => domainReferenceValue(kind, url, file), [file, kind, url]);

  return {
    kind,
    setKind,
    url,
    setUrl,
    file,
    setFile,
    saving,
    setSaving,
    error,
    setError,
    canSave,
    referenceValue,
  };
}
