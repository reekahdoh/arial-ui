import type { ReactNode } from 'react';
import { Alert, Box, CircularProgress } from '@mui/material';
import { AppCTAButton } from '../../../components/ui/AppCTAButton';
import { AppCard } from '../../../components/ui/AppCard';
import { PageHeader } from '../../../components/ui/PageHeader';
import { appCtaButtonTrackSx } from '../../../theme/tokens';
import { ProjectRequirementsViewDialog } from './ProjectRequirementsViewDialog';
import { NewRiskAssessmentWizardStepContent } from './NewRiskAssessmentWizardSteps';
import { useNewRiskAssessmentWizard } from './useNewRiskAssessmentWizard';

type Wizard = ReturnType<typeof useNewRiskAssessmentWizard>;

function reviewActionLabel(wizard: Wizard): string {
  if (wizard.isSaving) return 'Saving…';
  if (wizard.isRunning) return 'Starting…';
  return wizard.hasProjectRequirements ? 'Run Risk Assessment' : 'Add Project Requirements';
}

function ReviewAction({ wizard }: { wizard: Wizard }) {
  return (
    <Box sx={appCtaButtonTrackSx}>
      <AppCTAButton
        variant={wizard.domain ? 'contained' : 'outlined'}
        color={wizard.hasProjectRequirements ? 'success' : 'primary'}
        fullWidth
        onClick={() => void wizard.handleReviewAction()}
        disabled={!wizard.allFieldsComplete || wizard.isSaving || wizard.isRunning}
      >
        {reviewActionLabel(wizard)}
      </AppCTAButton>
    </Box>
  );
}

function WizardCardBody({ wizard, nextButton }: { wizard: Wizard; nextButton: ReactNode }) {
  if (wizard.isLoadingExisting) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      {wizard.saveError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {wizard.saveError}
        </Alert>
      ) : null}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <NewRiskAssessmentWizardStepContent
          step={wizard.step}
          nextButton={nextButton}
          fields={wizard.fields}
          paths={wizard.paths}
          summary={wizard.summary}
        />
      </Box>
    </>
  );
}

export function NewRiskAssessmentPage() {
  const wizard = useNewRiskAssessmentWizard();

  const nextButton = (
    <Box sx={appCtaButtonTrackSx}>
      <AppCTAButton variant={wizard.stepIsComplete ? 'contained' : 'outlined'} fullWidth onClick={wizard.nextStep} disabled={!wizard.stepIsComplete}>
        Next
      </AppCTAButton>
    </Box>
  );

  const showReviewAction = !wizard.isLoadingExisting && wizard.step === 'review';

  return (
    <>
      <PageHeader
        title="Risk Assessment"
        description="Start creating a new Risk Assessment"
        descriptionVariant="body1"
        descriptionSx={{ fontSize: '1rem', lineHeight: 1.45 }}
        actions={showReviewAction ? <ReviewAction wizard={wizard} /> : undefined}
      />
      <AppCard>
        <WizardCardBody wizard={wizard} nextButton={nextButton} />
      </AppCard>
      <ProjectRequirementsViewDialog
        open={wizard.projectRequirementsFileView.open}
        onClose={() => wizard.projectRequirementsFileView.setOpen(false)}
        displayLabel={wizard.projectRequirementsFileView.displayLabel}
        reading={wizard.projectRequirementsFileView.reading}
        error={wizard.projectRequirementsFileView.error}
        text={wizard.projectRequirementsFileView.text}
      />
    </>
  );
}
