import Button, { type ButtonProps } from '@mui/material/Button';
import { Link as RouterLink } from 'react-router-dom';
import { appCtaButton } from '../../theme/tokens';

function mergeCtaSx(sx: ButtonProps['sx']) {
  return [appCtaButton.sx, ...(Array.isArray(sx) ? sx : sx != null ? [sx] : [])];
}

/**
 * Standard large primary CTAs (key page actions). For in-app routes use
 * {@link AppCTAButtonLink} so `to` is typed correctly.
 */
export function AppCTAButton({ sx, color = 'primary', size = appCtaButton.muiSize, ...props }: ButtonProps) {
  return <Button color={color} size={size} {...props} sx={mergeCtaSx(sx)} />;
}

export type AppCTAButtonLinkProps = Omit<ButtonProps<typeof RouterLink>, 'component'>;

/** Same styling as {@link AppCTAButton}, rendered as a client-side router link. */
export function AppCTAButtonLink({
  sx,
  color = 'primary',
  size = appCtaButton.muiSize,
  ...props
}: AppCTAButtonLinkProps) {
  return (
    <Button<typeof RouterLink>
      {...props}
      component={RouterLink}
      color={color}
      size={size}
      sx={mergeCtaSx(sx)}
    />
  );
}
