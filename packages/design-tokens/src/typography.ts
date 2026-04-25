export const typography = {
  fontFamily: {
    sans: '"Inter", "Helvetica Neue", Arial, sans-serif',
    mono: '"SFMono-Regular", Menlo, Consolas, monospace',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    display: 36,
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.2,
    base: 1.5,
    relaxed: 1.75,
  },
} as const;

export type Typography = typeof typography;
