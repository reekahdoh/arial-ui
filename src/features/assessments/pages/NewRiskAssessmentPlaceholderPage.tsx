import { Alert, Box } from '@mui/material';
import { AppCTAButton } from '../../../components/ui/AppCTAButton';
import { AppCard } from '../../../components/ui/AppCard';
import { PageHeader } from '../../../components/ui/PageHeader';
import { appCtaButtonTrackSx } from '../../../theme/tokens';
import { ProjectRequirementsViewDialog } from './ProjectRequirementsViewDialog';
import { NewRiskAssessmentWizardStepContent } from './NewRiskAssessmentWizardSteps';
import { useNewRiskAssessmentWizard } from './useNewRiskAssessmentWizard';

export function NewRiskAssessmentPage() {
  const wizard = useNewRiskAssessmentWizard();

  const nextButton = (
    <Box sx={appCtaButtonTrackSx}>
      <AppCTAButton variant={wizard.stepIsComplete ? 'contained' : 'outlined'} fullWidth onClick={wizard.nextStep} disabled={!wizard.stepIsComplete}>
        Next
      </AppCTAButton>
    </Box>
  );

  return (
    <>
      <PageHeader
        title="Risk Assessment"
        description="Start creating a new Risk Assessment"
        descriptionVariant="body1"
        descriptionSx={{ fontSize: '1rem', lineHeight: 1.45 }}
        actions={
          wizard.step === 'review' ? (
            <Box sx={appCtaButtonTrackSx}>
              <AppCTAButton
                variant={wizard.domain ? 'contained' : 'outlined'}
                color={wizard.hasProjectRequirements ? 'success' : 'primary'}
                fullWidth
                onClick={() => void wizard.handleReviewAction()}
                disabled={!wizard.allFieldsComplete || wizard.isSaving || wizard.isRunning}
              >
                {wizard.isSaving
                  ? 'Saving…'
                  : wizard.isRunning
                    ? 'Starting…'
                    : wizard.hasProjectRequirements
                      ? 'Run Risk Assessment'
                      : 'Add Project Requirements'}
              </AppCTAButton>
            </Box>
          ) : undefined
        }
      />
      <AppCard>
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
