# @raisin/design-tokens

Framework-agnostic design tokens for the Raisin frontend platform. Single source of truth for color, spacing, typography, and radius. Consumed by `@raisin/design-system` (React) today; ready for an Angular wrapper or any other framework tomorrow.

## Two consumption modes

**TypeScript** (recommended for React/Angular libs):

```ts
import { colors, spacing, tokens } from '@raisin/design-tokens';

const styles = { color: colors.brand.primary, padding: spacing.md };
```

**JSON** (for Style Dictionary, Tailwind, native iOS/Android, or any non-TS toolchain):

```ts
import tokens from '@raisin/design-tokens/tokens.json';
```

The JSON conforms to the W3C Design Tokens Community Group draft format.

## Why not put these in design-system?

Locking tokens into one framework is the most expensive mistake a design system can make. Pulling them out means an Angular team can ship a `@raisin/design-system-ng` next quarter without re-discussing brand colors with the design team.
