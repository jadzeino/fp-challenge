# @raisin/eslint-config

Shared ESLint configuration for the Raisin frontend platform.

## Usage

In a package's `.eslintrc.js`:

```js
module.exports = {
  root: true,
  extends: ['@raisin/eslint-config'],
};
```

Add `@raisin/eslint-config` to `devDependencies` (`workspace:*`).

## Why centralize

ESLint hygiene drift is one of the most common silent failures in a multi-team monorepo. One package disabling `react-hooks/rules-of-hooks` to ship a quick fix, then never re-enabling it. Centralizing makes the lint contract a single, reviewable surface.

This package also hosts platform-wide guardrails (added incrementally), e.g. `no-restricted-imports` rules that prevent shared libraries from leaking heavyweight transitive dependencies (see ADR 0006).
