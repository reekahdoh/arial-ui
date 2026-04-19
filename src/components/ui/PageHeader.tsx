import { Box, Typography, type TypographyProps } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import type { ReactNode } from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
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
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
        gap: 2,
        mb: 2,
      }}
    >
      <Box>
        <Typography variant="h2" component="h1" color="text.primary">
          {title}
        </Typography>
        {description ? (
          <Typography
            variant={descriptionVariant}
            color="text.secondary"
            sx={[{ mt: 0.5, maxWidth: 720 }, ...(Array.isArray(descriptionSx) ? descriptionSx : descriptionSx ? [descriptionSx] : [])]}
          >
            {description}
          </Typography>
        ) : null}
      </Box>
      {actions ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            gap: 1,
            flexShrink: 0,
            width: { xs: '100%', sm: 'auto' },
            justifyContent: { xs: 'center', sm: 'flex-end' },
          }}
        >
          {actions}
        </Box>
      ) : null}
    </Box>
  );
}
