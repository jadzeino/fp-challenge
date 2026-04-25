export const colors = {
  brand: {
    primary: '#0E2240',
    primaryHover: '#162E54',
    accent: '#3FB984',
    accentHover: '#34A876',
  },
  text: {
    default: '#0E2240',
    muted: '#5A6580',
    inverse: '#FFFFFF',
  },
  surface: {
    page: '#F7F8FB',
    card: '#FFFFFF',
    raised: '#FFFFFF',
    overlay: 'rgba(14, 34, 64, 0.08)',
  },
  feedback: {
    success: '#1F9D55',
    warning: '#C9740E',
    danger: '#C0392B',
    info: '#0E66B0',
  },
  border: {
    subtle: '#E1E5EE',
    strong: '#B7BFD0',
  },
} as const;

export type Colors = typeof colors;
