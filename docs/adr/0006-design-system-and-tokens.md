# ADR 0006 — Design system: tokens-first, framework-agnostic

- Status: accepted
- Date: 2026-04-25

## Context

A design system that ties brand values to one framework is the most expensive bet a platform team can make. When the next app picks Angular (or React Server Components, or Solid), the alternative is either "two design systems" or "the team that wants Angular cannot ship".

## Decision

Two packages:

- **`@raisin/design-tokens`** — framework-agnostic. JSON tokens conforming to the W3C Design Tokens draft format, plus a TypeScript export for typed consumers. No React, no MUI, no anything.
- **`@raisin/design-system`** — React + MUI v5 wrappers that consume tokens. Components forward props (no hidden hardcodes — the historical Button bug is the cautionary tale). All MUI imports must be deep (`@mui/material/Button`); the platform ESLint config enforces it.

A future `@raisin/design-system-ng` (Angular) wraps the same tokens.

## Consequences

- Brand changes touch one JSON file.
- The lint guardrail makes "shared library leaks heavyweight transitive deps into consumers" structurally impossible. The Task 1 perf regression cannot recur.
- Adding components is now a recipe: deep MUI import, consume tokens, forward all props, RTL test, contract review.

## Alternatives considered

- **Single React-only design system** — fastest now, expensive later when a non-React app shows up.
- **Tokens via Style Dictionary build step** — overkill for the current token count; the JSON is hand-maintained until consumers diversify.
- **Tailwind + tokens** — tempting but the stack is MUI-rooted; introducing Tailwind is a separate decision that does not need to ride on this one.
