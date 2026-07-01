import { Box, TextField, Typography } from '@mui/material';
import type { KeyboardEvent, MouseEvent } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { RiskAssessmentOvalSection } from '../../../components/ui/RiskAssessmentOvalSection';
import { DomainSelectFields, EditAccessory } from './NewRiskAssessmentWizardStepParts';
import { linkPanelSx, type DomainKey } from './newRiskAssessmentWizardTypes';

export type ReviewWizardStepProps = {
  assessmentId: string;
  name: string;
  setName: (value: string) => void;
  owner: string;
  setOwner: (value: string) => void;
  riskOwner: string;
  setRiskOwner: (value: string) => void;
  companyName: string;
  setCompanyName: (value: string) => void;
  domain: DomainKey | '';
  setDomain: (domain: DomainKey) => void;
  customerDomainPath: string;
  projectRequirementsPath: string;
  projectRequirementsSummaryRows: Array<{ type: string; details: string }>;
  hasProjectRequirements: boolean;
  hasProjectRequirementsDocument: boolean;
  onViewProjectRequirementsDocument: (event: MouseEvent | KeyboardEvent) => void;
};

function DomainEditAccessory({ assessmentId, domain }: { assessmentId: string; domain: DomainKey | '' }) {
  if (!domain) {
    return (
      <Typography component="span" variant="body2" color="text.disabled" sx={{ fontWeight: 600 }}>
        Edit
      </Typography>
    );
  }
  return (
    <Typography
      component={RouterLink}
      to={`/domains/${domain}?assessmentId=${encodeURIComponent(assessmentId)}`}
      variant="body2"
      sx={{ fontWeight: 600, color: 'primary.main', textDecoration: 'none', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
    >
      Edit
    </Typography>
  );
}

function ReviewTextFields({
  name,
  setName,
  owner,
  riskOwner,
  setRiskOwner,
  companyName,
  setCompanyName,
  domain,
  setDomain,
  assessmentId,
}: Pick<
  ReviewWizardStepProps,
  'name' | 'setName' | 'owner' | 'riskOwner' | 'setRiskOwner' | 'companyName' | 'setCompanyName' | 'domain' | 'setDomain' | 'assessmentId'
>) {
  return (
    <>
      <RiskAssessmentOvalSection title="Name" description="The name for this Risk Assessment">
        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
      </RiskAssessmentOvalSection>
      <RiskAssessmentOvalSection title="Owner" description="Responsible for setting up this Risk Assessment">
        <TextField
          label="Owner"
          value={owner}
          fullWidth
          slotProps={{
            input: {
              readOnly: true,
            },
          }}
        />
      </RiskAssessmentOvalSection>
      <RiskAssessmentOvalSection
        title="Risk Owner"
        description="Responsible for owning and managing risk decisions during this assessment"
      >
        <TextField label="Risk Owner" value={riskOwner} onChange={(e) => setRiskOwner(e.target.value)} fullWidth />
      </RiskAssessmentOvalSection>
      <RiskAssessmentOvalSection title="Company" description="The company undergoing the Risk Assessment">
        <TextField label="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} fullWidth />
      </RiskAssessmentOvalSection>
      <RiskAssessmentOvalSection
        title="Authoritative Domain"
        description="A focused area of the business or system where related risks are grouped so they can be assessed, owned, and managed consistently"
        titleAccessory={<DomainEditAccessory assessmentId={assessmentId} domain={domain} />}
      >
        <DomainSelectFields domain={domain} setDomain={setDomain} />
      </RiskAssessmentOvalSection>
    </>
  );
}

function ProjectRequirementsEditAccessory({
  hasDocument,
  onViewDocument,
}: {
  hasDocument: boolean;
  onViewDocument: (event: MouseEvent | KeyboardEvent) => void;
}) {
  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5 }}>
      {hasDocument ? (
        <Typography
          component="span"
          role="button"
          tabIndex={0}
          variant="body2"
          color="primary.main"
          sx={{ fontWeight: 600, cursor: 'pointer' }}
          onClick={(event) => void onViewDocument(event)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              void onViewDocument(event);
            }
          }}
        >
          View
        </Typography>
      ) : null}
      <EditAccessory />
    </Box>
  );
}

function ReviewLinkPanels({
  customerDomainPath,
  projectRequirementsPath,
  projectRequirementsSummaryRows,
  hasProjectRequirements,
  hasProjectRequirementsDocument,
  onViewProjectRequirementsDocument,
}: Pick<
  ReviewWizardStepProps,
  | 'customerDomainPath'
  | 'projectRequirementsPath'
  | 'projectRequirementsSummaryRows'
  | 'hasProjectRequirements'
  | 'hasProjectRequirementsDocument'
  | 'onViewProjectRequirementsDocument'
>) {
  return (
    <>
      <RiskAssessmentOvalSection
        component={RouterLink}
        {...{ to: customerDomainPath }}
        title="Customer Domain"
        description="Capture customer-specific domain references and context for this assessment."
        titleAccessory={<EditAccessory />}
        sx={linkPanelSx}
      >
        {null}
      </RiskAssessmentOvalSection>
      {hasProjectRequirements ? (
        <RiskAssessmentOvalSection
          component={RouterLink}
          {...{ to: projectRequirementsPath }}
          title="Project Requirements"
          description="Saved requirements and supporting references for this assessment."
          titleAccessory={
            <ProjectRequirementsEditAccessory
              hasDocument={hasProjectRequirementsDocument}
              onViewDocument={onViewProjectRequirementsDocument}
            />
          }
          sx={[linkPanelSx, { gridColumn: { xs: 'auto', md: '1 / -1' } }]}
        >
          <Box sx={{ display: 'grid', gap: 0.75 }}>
            {projectRequirementsSummaryRows.map((row) => (
              <Typography key={`${row.type}-${row.details}`} variant="body2" color="text.secondary">
                <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {row.type}:
                </Box>{' '}
                {row.details}
              </Typography>
            ))}
          </Box>
        </RiskAssessmentOvalSection>
      ) : null}
    </>
  );
}

export function ReviewWizardStep(props: ReviewWizardStepProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
        gap: 3,
        alignItems: 'stretch',
        '& > *': { minWidth: 0 },
      }}
    >
      <ReviewTextFields {...props} />
      <ReviewLinkPanels {...props} />
    </Box>
  );
}
