import { useState } from 'react';
import { emptyProjectRequirements, type ProjectRequirementsFields } from '../../../domain/projectRequirements';
import type { DomainKey, WizardStep } from './newRiskAssessmentWizardTypes';

export function useNewRiskAssessmentWizardState() {
  const [assessmentId, setAssessmentId] = useState('');
  const [step, setStep] = useState<WizardStep>('name');
  const [name, setName] = useState('');
  const [owner, setOwner] = useState('');
  const [riskOwner, setRiskOwner] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [domain, setDomain] = useState<DomainKey | ''>('');
  const [projectRequirements, setProjectRequirements] = useState<ProjectRequirementsFields>(() => emptyProjectRequirements());
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [persistTick, setPersistTick] = useState(0);

  return {
    assessmentId,
    setAssessmentId,
    step,
    setStep,
    name,
    setName,
    owner,
    setOwner,
    riskOwner,
    setRiskOwner,
    companyName,
    setCompanyName,
    domain,
    setDomain,
    projectRequirements,
    setProjectRequirements,
    saveError,
    setSaveError,
    isSaving,
    setIsSaving,
    isRunning,
    setIsRunning,
    persistTick,
    setPersistTick,
    draftSetters: { setName, setOwner, setRiskOwner, setCompanyName, setDomain, setStep, setProjectRequirements },
  };
}
