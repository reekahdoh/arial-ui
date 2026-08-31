import { createContext, type ReactNode, useContext, useMemo, useState } from 'react';
import type { ProjectRequirementsFields } from '../domain/projectRequirements';

export interface RiskAssessmentRunDraft {
  assessmentId: string;
  name: string;
  owner: string;
  riskOwner: string;
  companyName: string;
  domain: 'ai' | 'medical-device' | '';
  customerContext?: ProjectRequirementsFields;
  customerReferenceText: string;
}

interface RiskAssessmentRunContextValue {
  draft: RiskAssessmentRunDraft | null;
  setDraft: (draft: RiskAssessmentRunDraft | null) => void;
}

const RiskAssessmentRunContext = createContext<RiskAssessmentRunContextValue | null>(null);

export function RiskAssessmentRunProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<RiskAssessmentRunDraft | null>(null);
  const value = useMemo(() => ({ draft, setDraft }), [draft]);

  return (
    <RiskAssessmentRunContext.Provider value={value}>
      {children}
    </RiskAssessmentRunContext.Provider>
  );
}

export function useRiskAssessmentRun() {
  const ctx = useContext(RiskAssessmentRunContext);
  if (!ctx) {
    throw new Error('useRiskAssessmentRun must be used within RiskAssessmentRunProvider');
  }
  return ctx;
}
