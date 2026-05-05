/** Customer context captured on the Add Customer Context screen (persisted locally and/or in Firestore). */
export interface CustomerContextFields {
  /** Original file name, or null if cleared / never set */
  fileName: string | null;
  /** Display line (name, type, size); null when no file */
  fileMeta: string | null;
  websiteUrl: string;
  emailTitle: string;
  freeformText: string;
}

export function emptyCustomerContext(): CustomerContextFields {
  return {
    fileName: null,
    fileMeta: null,
    websiteUrl: '',
    emailTitle: '',
    freeformText: '',
  };
}

export function normalizeCustomerContext(
  raw: Partial<CustomerContextFields> | undefined | null,
): CustomerContextFields {
  const base = emptyCustomerContext();
  if (!raw || typeof raw !== 'object') return base;
  return {
    fileName:
      raw.fileName === null || typeof raw.fileName === 'string' ? raw.fileName : base.fileName,
    fileMeta:
      raw.fileMeta === null || typeof raw.fileMeta === 'string' ? raw.fileMeta : base.fileMeta,
    websiteUrl: typeof raw.websiteUrl === 'string' ? raw.websiteUrl : base.websiteUrl,
    emailTitle: typeof raw.emailTitle === 'string' ? raw.emailTitle : base.emailTitle,
    freeformText: typeof raw.freeformText === 'string' ? raw.freeformText : base.freeformText,
  };
}
