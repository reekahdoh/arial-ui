import { createTheme } from '@mui/material/styles';
import { accentPrimary, neutral, spacingUnit } from './tokens';

const hairlineShadow = '0 1px 0 rgba(15, 23, 42, 0.06)';

export const appTheme = createTheme({
  spacing: spacingUnit,
  /** Same value as `shapeBorderRadius.sm` — outlined cards, inset panels, `OutlinedInput`. */
  shape: {
    borderRadius: 6,
  },
  shapeBorderRadius: {
    xs: 4,
    /** Outlined `AppCard`, inset form panels (`RiskAssessmentOvalSection`), outlined inputs. */
    sm: 6,
    md: 10,
    /** Larger surfaces (e.g. modals). */
    panel: 20,
  },
  shadowsElevation: {
    none: 'none',
    hairline: hairlineShadow,
  },
  palette: {
    mode: 'light',
    primary: accentPrimary,
    text: {
      primary: neutral[900],
      secondary: neutral[600],
      disabled: neutral[400],
    },
    background: {
      default: neutral[50],
      paper: '#ffffff',
    },
    divider: neutral[200],
    border: {
      subtle: neutral[200],
      default: neutral[300],
    },
    surface: {
      canvas: neutral[50],
      panel: '#ffffff',
      inset: neutral[100],
    },
    status: {
      low: neutral[500],
      medium: '#b45309',
      high: '#c2410c',
      critical: '#991b1b',
    },
    workflow: {
      draft: neutral[500],
      /** Teal-600 — same family as primary */
      in_review: '#0D9488',
      approved: '#15803d',
      archived: neutral[400],
    },
    action: {
      hover: 'rgba(15, 23, 42, 0.04)',
      selected: 'rgba(15, 118, 110, 0.08)',
      focus: 'rgba(15, 118, 110, 0.12)',
    },
  },
  typography: {
    fontFamily:
      '"Inter", "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    fontSize: 13,
    htmlFontSize: 16,
    h1: { fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.3 },
    h2: { fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.35 },
    h3: { fontSize: '1.05rem', fontWeight: 600, lineHeight: 1.4 },
    h4: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.4 },
    h5: { fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.4 },
    h6: { fontSize: '0.9rem', fontWeight: 600, lineHeight: 1.45 },
    subtitle1: { fontSize: '0.9rem', fontWeight: 500, lineHeight: 1.45, color: neutral[700] },
    subtitle2: { fontSize: '0.85rem', fontWeight: 500, lineHeight: 1.45 },
    body1: { fontSize: '0.875rem', lineHeight: 1.5 },
    body2: { fontSize: '0.8125rem', lineHeight: 1.5 },
    button: { fontSize: '0.8125rem', fontWeight: 600, textTransform: 'none', letterSpacing: 0 },
    caption: { fontSize: '0.75rem', lineHeight: 1.45, color: neutral[600] },
    dataEmphasis: { fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.45 },
    data: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.45 },
    captionStrong: { fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.45 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: neutral[50],
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        outlined: {
          borderColor: neutral[200],
          boxShadow: 'none',
        },
      },
    },
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
        color: 'inherit',
      },
      styleOverrides: {
        root: ({ theme }) => ({
          borderBottom: `1px solid ${theme.palette.border.subtle}`,
          backgroundColor: theme.palette.surface.panel,
        }),
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRight: `1px solid ${theme.palette.border.subtle}`,
          backgroundColor: theme.palette.surface.panel,
        }),
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          /** `&&` beats OutlinedInput’s own `borderRadius` rule. Same radius as `AppCard` / inset panels (`shapeBorderRadius.sm`). */
          '&&': {
            borderRadius: theme.shapeBorderRadius.sm,
          },
          '&& .MuiOutlinedInput-notchedOutline': {
            borderRadius: theme.shapeBorderRadius.sm,
          },
        }),
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: ({ theme }) => ({
          fontSize: theme.typography.caption.fontSize,
          fontWeight: 600,
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          color: theme.palette.text.secondary,
          backgroundColor: theme.palette.surface.inset,
          borderBottom: `1px solid ${theme.palette.border.subtle}`,
        }),
        body: ({ theme }) => ({
          borderBottom: `1px solid ${theme.palette.border.subtle}`,
        }),
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: ({ theme }) => ({
          '&:last-of-type td': {
            borderBottom: 'none',
          },
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
          },
        }),
      },
    },
  },
});
