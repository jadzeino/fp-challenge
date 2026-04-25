# @raisin/design-system

React component library for the Raisin frontend platform. Built on top of MUI v5 and consumes `@raisin/design-tokens` so brand values stay in one place.

> **Renamed**: this package was previously `@raisin/lib1`. Migration is a one-line import swap.

## Install

```json
{
  "dependencies": {
    "@raisin/design-system": "workspace:*"
  }
}
```

Peer dependencies: `react` 17.x, `react-dom` 17.x, `@mui/material` 5.x, `@emotion/styled` 11.x. The platform's root `package.json` already pins these.

## Usage

```tsx
import { Button } from '@raisin/design-system';

const MyComponent = () => <Button variant="contained" onClick={handleClick}>Click Me</Button>;
```

## Authoring rules

1. **Use deep MUI imports.** Always `import Button from '@mui/material/Button'`, never `import { Button } from '@mui/material'`. The barrel form pulls every MUI component into consumer bundles. The platform's ESLint config enforces this.
2. **Consume tokens, not magic numbers.** Use `spacing.md`, `colors.brand.primary`, etc. from `@raisin/design-tokens`.
3. **Forward all props.** Never strip or hardcode handlers; you'll silently break callers (see the historical Button bug for the cautionary tale).

## Build

```bash
pnpm run build:library
```

Compiles TypeScript to `lib/` (CJS + d.ts + sourcemaps). Apps import the built artifact, not the source, so they don't pay TypeScript compile cost.
