/**
 * Raw design tokens (no theme functions). Values are referenced from theme.ts
 * so components never hardcode hex/rgb.
 */
export const accentPrimary = {
  /** Teal-700 — primary actions, contained buttons */
  main: '#0F766E',
  /** Teal-800 — hover/pressed emphasis on primary */
  dark: '#115E59',
  /** Teal-500 — lighter primary variant (outlines, secondary emphasis) */
  light: '#14B8A6',
  contrastText: '#ffffff',
} as const;

export const neutral = {
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a',
} as const;

/** Risk bands — green (low), orange (moderate), red (high). Used on Risk Report and severity chips. */
export const riskLevelColors = {
  low: {
    main: '#2e7d32',
    contrastText: '#ffffff',
  },
  moderate: {
    main: '#ed6c02',
    contrastText: '#ffffff',
  },
  high: {
    main: '#d32f2f',
    contrastText: '#ffffff',
  },
} as const;

export const spacingUnit = 8;

export const layout = {
  sidebarWidth: 232,
  topBarHeight: 104,
  contentMaxWidth: 1200,
  contentPaddingX: 3,
  contentPaddingY: 3,
} as const;

/** Home hero CTAs, page-header actions (Save, etc.) — use `AppCTAButton` / `AppCTAButtonLink` */
export const appCtaButton = {
  muiSize: 'large' as const,
  /** Width cap for `fullWidth` CTAs (home hero column, page-header Save, …) */
  columnMaxWidth: 320,
  sx: { py: 1.25, fontWeight: 600 } as const,
} as const;

/** Fixed track for header CTAs (e.g. Save) — keeps width aligned with `columnMaxWidth`. */
export const appCtaButtonTrackSx = {
  width: { xs: '100%', sm: appCtaButton.columnMaxWidth },
  maxWidth: appCtaButton.columnMaxWidth,
  flexShrink: 0,
} as const;
