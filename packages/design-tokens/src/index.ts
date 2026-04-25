export { colors } from './colors';
export type { Colors } from './colors';

export { spacing } from './spacing';
export type { Spacing, SpacingKey } from './spacing';

export { typography } from './typography';
export type { Typography } from './typography';

export { radius } from './radius';
export type { Radius } from './radius';

import { colors } from './colors';
import { spacing } from './spacing';
import { typography } from './typography';
import { radius } from './radius';

export const tokens = { colors, spacing, typography, radius } as const;
export type Tokens = typeof tokens;
