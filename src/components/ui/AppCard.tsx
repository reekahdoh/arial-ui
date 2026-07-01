import { Card, CardContent, type CardProps, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export interface AppCardProps extends CardProps {
  title?: string;
  children: ReactNode;
}

/** Opinionated surface card: outlined, low elevation, consistent padding. */
export function AppCard({ title, children, sx, ...rest }: AppCardProps) {
  return (
    <Card
      square
      variant="outlined"
      sx={[
        { borderRadius: (t) => t.shapeBorderRadius.sm, minWidth: 0, maxWidth: '100%' },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...rest}
    >
      <CardContent sx={{ p: 2, minWidth: 0, '&:last-child': { pb: 2 } }}>
        {title ? (
          <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>
            {title}
          </Typography>
        ) : null}
        {children}
      </CardContent>
    </Card>
  );
}
