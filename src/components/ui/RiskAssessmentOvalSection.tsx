import { Box, Typography, type BoxProps } from '@mui/material';
import type { ReactNode } from 'react';
import {
  riskAssessmentOvalSectionContainerSx,
  riskAssessmentOvalSectionDescriptionSx,
  riskAssessmentOvalSectionTitleSx,
} from '../../theme/riskAssessmentOvalSection';

export interface RiskAssessmentOvalSectionProps extends BoxProps {
  /** Section heading shown inside the oval. */
  title: string;
  /** Renders on the same row as the title (e.g. an Edit link). */
  titleAccessory?: ReactNode;
  /** Optional short line under the title. */
  description?: string;
  children: ReactNode;
}

/** Rounded-rectangle panel used to group fields on the Risk Assessment flow. */
export function RiskAssessmentOvalSection({
  title,
  titleAccessory,
  description,
  children,
  sx,
  ...rest
}: RiskAssessmentOvalSectionProps) {
  const titleRowSx = {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
    gap: 2,
    minWidth: 0,
    width: '100%',
    ...riskAssessmentOvalSectionTitleSx(!!description),
  };

  return (
    <Box
      sx={[
        (theme) => riskAssessmentOvalSectionContainerSx(theme),
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...rest}
    >
      {titleAccessory != null ? (
        <Box sx={titleRowSx}>
          <Typography
            variant="subtitle1"
            component="h2"
            sx={{
              minWidth: 0,
              flex: '1 1 auto',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </Typography>
          <Box sx={{ position: 'relative', zIndex: 1, flexShrink: 0 }}>{titleAccessory}</Box>
        </Box>
      ) : (
        <Typography variant="subtitle1" component="h2" sx={riskAssessmentOvalSectionTitleSx(!!description)}>
          {title}
        </Typography>
      )}
      {description ? (
        <Typography variant="body2" color="text.secondary" sx={riskAssessmentOvalSectionDescriptionSx}>
          {description}
        </Typography>
      ) : null}
      {children}
    </Box>
  );
}
