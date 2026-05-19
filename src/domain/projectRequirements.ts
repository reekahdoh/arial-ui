/** Project requirements captured on the Add Project Requirements screen (persisted locally and/or in Firestore). */
export interface ProjectRequirementsFields {
  /** Original file name, or null if cleared / never set */
  fileName: string | null;
  /** Display line (name, type, size); null when no file */
  fileMeta: string | null;
  websiteUrl: string;
  emailTitle: string;
  freeformText: string;
  /** Text snapshot of the uploaded document, used for View when the API has no download route. */
  documentContent: string | null;
  /** Backend requirements document id returned from PUT /requirements. */
  requirementsDocId: string | null;
}

export function emptyProjectRequirements(): ProjectRequirementsFields {
  return {
    fileName: null,
    fileMeta: null,
    websiteUrl: '',
    emailTitle: '',
    freeformText: '',
    documentContent: null,
    requirementsDocId: null,
  };
}

function optionalStringField(
  raw: unknown,
  fallback: string | null,
): string | null {
  if (raw === null) return null;
  return typeof raw === 'string' ? raw : fallback;
}

/** Shape stored under risk assessment `customerContext` in Firestore. */
export function customerContextForFirestore(fields: ProjectRequirementsFields): ProjectRequirementsFields {
  return {
    fileName: fields.fileName,
    fileMeta: fields.fileMeta,
    websiteUrl: fields.websiteUrl,
    emailTitle: fields.emailTitle,
    freeformText: fields.freeformText,
    documentContent: fields.documentContent,
    requirementsDocId: fields.requirementsDocId,
  };
}

export function normalizeProjectRequirements(
  raw: Partial<ProjectRequirementsFields> | undefined | null,
): ProjectRequirementsFields {
  const base = emptyProjectRequirements();
  if (!raw || typeof raw !== 'object') return base;
  return {
    fileName:
      raw.fileName === null || typeof raw.fileName === 'string' ? raw.fileName : base.fileName,
    fileMeta:
      raw.fileMeta === null || typeof raw.fileMeta === 'string' ? raw.fileMeta : base.fileMeta,
    websiteUrl: typeof raw.websiteUrl === 'string' ? raw.websiteUrl : base.websiteUrl,
    emailTitle: typeof raw.emailTitle === 'string' ? raw.emailTitle : base.emailTitle,
    freeformText: typeof raw.freeformText === 'string' ? raw.freeformText : base.freeformText,
    documentContent: optionalStringField(raw.documentContent, base.documentContent),
    requirementsDocId: optionalStringField(raw.requirementsDocId, base.requirementsDocId),
  };
}
