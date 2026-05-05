import { Box, Divider, Typography, type TypographyProps } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import type { ReactNode } from 'react';

/** Shared flex row so every action control matches the tallest control in the header (handles mixed Button sizes and Box-wrapped CTAs). */
const pageHeaderActionsRowSx = {
  display: 'flex',
  flexDirection: 'row',
  gap: 1,
  flexShrink: 0,
  alignItems: 'stretch',
  '& > .MuiButton-root': {
    alignSelf: 'stretch',
  },
  '& > .MuiBox-root': {
    alignSelf: 'stretch',
    display: 'flex',
    flexDirection: 'column',
    '& > .MuiButton-root': {
      flex: 1,
      width: '100%',
    },
  },
} satisfies SxProps<Theme>;

const pageHeaderDividerSx = {
  gridColumn: '1 / -1',
  borderColor: 'divider',
} satisfies SxProps<Theme>;

/** Vertical rhythm around the separator (same everywhere). */
const pageHeaderDividerSpacingSx = {
  my: 3,
  borderColor: 'divider',
} satisfies SxProps<Theme>;

/** Subtitle uses the full width of the header (no column cap). */
const pageHeaderDescriptionBaseSx = {
  width: '100%',
  minWidth: 0,
} satisfies SxProps<Theme>;

export interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  /** Defaults to `body2`. */
  descriptionVariant?: TypographyProps['variant'];
  descriptionSx?: SxProps<Theme>;
  actions?: ReactNode;
}

export function PageHeader({
  title,
  description,
  descriptionVariant = 'body2',
  descriptionSx,
  actions,
}: PageHeaderProps) {
  const descriptionSxList = [...(Array.isArray(descriptionSx) ? descriptionSx : descriptionSx ? [descriptionSx] : [])];

  /** Title and actions share the top row (actions right-aligned); a divider separates that row from the description. */
  if (description && actions) {
    return (
      <Box sx={{ mb: 2 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr auto' },
            alignItems: { xs: 'stretch', sm: 'start' },
            columnGap: 2,
            rowGap: 0,
          }}
        >
          <Typography variant="h2" component="h1" color="text.primary" sx={{ gridColumn: 1, gridRow: { xs: 1, sm: 1 }, minWidth: 0 }}>
            {title}
          </Typography>
          <Box
            sx={[
              pageHeaderActionsRowSx,
              {
                width: { xs: '100%', sm: 'auto' },
                justifyContent: 'flex-end',
                gridColumn: { xs: 1, sm: 2 },
                gridRow: { xs: 2, sm: 1 },
              },
            ]}
          >
            {actions}
          </Box>
          <Divider variant="fullWidth" sx={{ ...pageHeaderDividerSx, ...pageHeaderDividerSpacingSx, gridRow: { xs: 3, sm: 2 } }} />
          <Typography
            variant={descriptionVariant}
            component="div"
            color="text.secondary"
            sx={[{ ...pageHeaderDescriptionBaseSx, gridColumn: '1 / -1', gridRow: { xs: 4, sm: 3 } }, ...descriptionSxList]}
          >
            {description}
          </Typography>
        </Box>
      </Box>
    );
  }

  if (description && !actions) {
    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="h2" component="h1" color="text.primary">
          {title}
        </Typography>
        <Divider variant="fullWidth" sx={{ ...pageHeaderDividerSpacingSx }} />
        <Typography
          variant={descriptionVariant}
          color="text.secondary"
          sx={[{ ...pageHeaderDescriptionBaseSx }, ...descriptionSxList]}
        >
          {description}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Typography variant="h2" component="h1" color="text.primary">
          {title}
        </Typography>
        {actions ? (
          <Box
            sx={[
              pageHeaderActionsRowSx,
              {
                width: { xs: '100%', sm: 'auto' },
                justifyContent: { xs: 'center', sm: 'flex-end' },
              },
            ]}
          >
            {actions}
          </Box>
        ) : null}
      </Box>
      <Divider variant="fullWidth" sx={{ ...pageHeaderDividerSpacingSx }} />
    </Box>
  );
}
