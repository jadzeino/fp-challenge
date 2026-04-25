# @raisin/tsconfig

Shared TypeScript configuration presets for the Raisin frontend platform.

## Presets

| Preset | Use for | Notes |
|---|---|---|
| `base.json` | rarely directly | strict + ESNext baseline; the others extend it |
| `next.json` | Next.js apps under `apps/` | preserves JSX, no emit (Next handles compile), incremental |
| `library.json` | shared React libraries built with `tsc` | emits CJS + d.ts + sourcemaps for consumers |
| `node.json` | Node-only packages (gateway, scripts) | targets ES2022, includes node types |

## Usage

In a package's `tsconfig.json`:

```jsonc
{
  "extends": "@raisin/tsconfig/next.json",
  "compilerOptions": {
    "baseUrl": "./src"
  },
  "include": ["./src/**/*"]
}
```

Add `@raisin/tsconfig` as a `devDependency` (`"@raisin/tsconfig": "workspace:*"`) so pnpm hoists it for resolution.

## Why centralize

Per-package tsconfigs were duplicating ~30 lines of strict + module + lib settings. Drift here is silent — one package opts out of `strict` and a class of bugs slips through CI without anyone noticing. Centralizing turns "TS hygiene" into a one-line PR (`bump @raisin/tsconfig`).
