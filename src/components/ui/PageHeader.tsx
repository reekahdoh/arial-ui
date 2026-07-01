import { Box, Divider, Typography, type TypographyProps } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import type { SystemStyleObject } from '@mui/system';
import type { ReactNode } from 'react';

/** Shared flex row so every action control matches the tallest control in the header. */
const pageHeaderActionsRowSx: SystemStyleObject<Theme> = {
  display: 'flex',
  flexDirection: 'row',
  gap: 1,
  flexShrink: 0,
  alignItems: 'stretch',
  '& > .MuiButton-root': { alignSelf: 'stretch' },
  '& > .MuiBox-root': {
    alignSelf: 'stretch',
    display: 'flex',
    flexDirection: 'column',
    '& > .MuiButton-root': { flex: 1, width: '100%' },
  },
};

const pageHeaderDividerSpacingSx: SystemStyleObject<Theme> = { my: 3, borderColor: 'divider' };
const pageHeaderDescriptionBaseSx: SystemStyleObject<Theme> = { width: '100%', minWidth: 0 };

const rootSx = { mb: 2 } as const;

export interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  descriptionVariant?: TypographyProps['variant'];
  descriptionSx?: SxProps<Theme>;
  actions?: ReactNode;
}

function isStyleObject(value: SxProps<Theme> | undefined): value is SystemStyleObject<Theme> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function descriptionSxList(descriptionSx?: SxProps<Theme>): SystemStyleObject<Theme>[] {
  if (!descriptionSx) return [];
  return Array.isArray(descriptionSx)
    ? descriptionSx.filter(isStyleObject)
    : isStyleObject(descriptionSx)
      ? [descriptionSx]
      : [];
}

function PageHeaderRoot({ children }: { children: ReactNode }) {
  return <Box sx={rootSx}>{children}</Box>;
}

function PageHeaderSeparator({ sx }: { sx?: SxProps<Theme> }) {
  return (
    <Divider
      variant="fullWidth"
      sx={{
        ...pageHeaderDividerSpacingSx,
        ...(isStyleObject(sx) ? sx : {}),
      }}
    />
  );
}

function PageHeaderTitle({ title, sx }: { title: string; sx?: SxProps<Theme> }) {
  return (
    <Typography variant="h2" component="h1" color="text.primary" sx={{ minWidth: 0, ...sx }}>
      {title}
    </Typography>
  );
}

function PageHeaderActions({ children, sx }: { children: ReactNode; sx?: SxProps<Theme> }) {
  return (
    <Box
      sx={{
        ...pageHeaderActionsRowSx,
        ...(isStyleObject(sx) ? sx : {}),
      }}
    >
      {children}
    </Box>
  );
}

function PageHeaderDescription({
  children,
  variant,
  sx,
}: {
  children: ReactNode;
  variant: TypographyProps['variant'];
  sx: SystemStyleObject<Theme>[];
}) {
  return (
    <Typography
      variant={variant}
      component="div"
      color="text.secondary"
      sx={{ ...pageHeaderDescriptionBaseSx, ...Object.assign({}, ...sx) }}
    >
      {children}
    </Typography>
  );
}

/** Title + optional actions + divider + description (grid when actions are present). */
function PageHeaderWithDescription({
  title,
  description,
  descriptionVariant = 'body2',
  descriptionSx,
  actions,
}: PageHeaderProps & { description: ReactNode }) {
  const descSx = descriptionSxList(descriptionSx);

  if (actions) {
    return (
      <PageHeaderRoot>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr auto' },
            alignItems: { xs: 'stretch', sm: 'start' },
            columnGap: 2,
            rowGap: 0,
          }}
        >
          <PageHeaderTitle title={title} sx={{ gridColumn: 1, gridRow: { xs: 1, sm: 1 }, minWidth: 0 }} />
          <PageHeaderActions
            sx={{
              width: { xs: '100%', sm: 'auto' },
              justifyContent: 'flex-end',
              gridColumn: { xs: 1, sm: 2 },
              gridRow: { xs: 2, sm: 1 },
            }}
          >
            {actions}
          </PageHeaderActions>
          <PageHeaderSeparator sx={{ gridColumn: '1 / -1', gridRow: { xs: 3, sm: 2 } }} />
          <PageHeaderDescription
            variant={descriptionVariant}
            sx={[{ gridColumn: '1 / -1', gridRow: { xs: 4, sm: 3 } }, ...descSx]}
          >
            {description}
          </PageHeaderDescription>
        </Box>
      </PageHeaderRoot>
    );
  }

  return (
    <PageHeaderRoot>
      <PageHeaderTitle title={title} />
      <PageHeaderSeparator />
      <PageHeaderDescription variant={descriptionVariant} sx={descSx}>
        {description}
      </PageHeaderDescription>
    </PageHeaderRoot>
  );
}

/** Title + optional actions, then divider (no description). */
function PageHeaderTitleRow({ title, actions }: PageHeaderProps) {
  return (
    <PageHeaderRoot>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <PageHeaderTitle title={title} />
        {actions ? (
          <PageHeaderActions sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'center', sm: 'flex-end' } }}>
            {actions}
          </PageHeaderActions>
        ) : null}
      </Box>
      <PageHeaderSeparator />
    </PageHeaderRoot>
  );
}

export function PageHeader(props: PageHeaderProps) {
  if (props.description) return <PageHeaderWithDescription {...props} description={props.description} />;
  return <PageHeaderTitleRow {...props} />;
}
