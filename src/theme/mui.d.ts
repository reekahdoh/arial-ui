import type { CSSProperties } from 'react';

declare module '@mui/material/styles' {
  interface TypographyVariants {
    dataEmphasis: CSSProperties;
    data: CSSProperties;
    captionStrong: CSSProperties;
  }

  interface TypographyVariantsOptions {
    dataEmphasis?: CSSProperties;
    data?: CSSProperties;
    captionStrong?: CSSProperties;
  }

  interface Theme {
    shapeBorderRadius: {
      xs: number;
      sm: number;
      md: number;
      panel: number;
    };
    shadowsElevation: {
      none: string;
      hairline: string;
    };
  }

  interface ThemeOptions {
    shapeBorderRadius?: {
      xs?: number;
      sm?: number;
      md?: number;
      panel?: number;
    };
    shadowsElevation?: {
      none?: string;
      hairline?: string;
    };
  }

  interface Palette {
    border: {
      subtle: string;
      default: string;
    };
    surface: {
      canvas: string;
      panel: string;
      inset: string;
    };
    status: {
      low: string;
      medium: string;
      high: string;
      critical: string;
    };
    workflow: {
      draft: string;
      in_review: string;
      approved: string;
      archived: string;
    };
  }

  interface PaletteOptions {
    border?: {
      subtle?: string;
      default?: string;
    };
    surface?: {
      canvas?: string;
      panel?: string;
      inset?: string;
    };
    status?: {
      low?: string;
      medium?: string;
      high?: string;
      critical?: string;
    };
    workflow?: {
      draft?: string;
      in_review?: string;
      approved?: string;
      archived?: string;
    };
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    dataEmphasis: true;
    data: true;
    captionStrong: true;
  }
}
