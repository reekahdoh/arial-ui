import { MenuItem, TextField, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { RiskAssessmentOvalSection } from '../../../components/ui/RiskAssessmentOvalSection';
import { DOMAIN_OPTIONS, type DomainKey } from './newRiskAssessmentWizardTypes';

export function EditAccessory() {
  return (
    <Typography component="span" variant="body2" color="primary.main" sx={{ fontWeight: 600 }}>
      Edit
    </Typography>
  );
}

export function WizardTextFieldStep({
  title,
  description,
  label,
  value,
  placeholder,
  onChange,
  nextButton,
}: {
  title: string;
  description: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  nextButton: ReactNode;
}) {
  return (
    <>
      <RiskAssessmentOvalSection title={title} description={description}>
        <TextField
          label={label}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          fullWidth
          autoFocus
        />
      </RiskAssessmentOvalSection>
      {nextButton}
    </>
  );
}

export function DomainSelectFields({
  domain,
  setDomain,
}: {
  domain: DomainKey | '';
  setDomain: (domain: DomainKey) => void;
}) {
  return (
    <TextField select label="Authoritative Domain" value={domain} onChange={(e) => setDomain(e.target.value as DomainKey)} fullWidth>
      {DOMAIN_OPTIONS.map((opt) => (
        <MenuItem key={opt.key} value={opt.key}>
          {opt.label}
        </MenuItem>
      ))}
    </TextField>
  );
}
