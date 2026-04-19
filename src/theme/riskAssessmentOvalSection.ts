import type { Theme } from '@mui/material/styles';

/** Inset bordered panel — Risk Assessment field groups; same corner radius as `AppCard` (`shapeBorderRadius.sm`). */
export function riskAssessmentOvalSectionContainerSx(theme: Theme) {
  const r = theme.shapeBorderRadius.sm;
  return {
    px: { xs: 3, sm: 3.5 },
    py: { xs: 3.25, sm: 3.75 },
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: r,
    overflow: 'hidden',
    bgcolor: 'surface.inset',
    boxShadow: theme.shadowsElevation.hairline,
  } as const;
}

export function riskAssessmentOvalSectionTitleSx(hasDescription: boolean) {
  return { mb: hasDescription ? 1 : 2 } as const;
}

export const riskAssessmentOvalSectionDescriptionSx = { mb: 2.5 } as const;
