# @raisin/api-contracts

The single source of truth for API shapes between Raisin frontend apps and backend services. Schemas are defined with Zod so we get **runtime validation + inferred TypeScript types** from one definition.

## Versioned exports

```ts
// Always import via the version namespace, never via the package root
// (the root re-exports `v1`, `v2`, ... so consumers can pin a version).
import { v1 } from '@raisin/api-contracts';

const account = v1.AccountSchema.parse(unknownPayload);
//    ^? type Account
```

Or import the version subpath directly for tighter coupling:

```ts
import { AccountSchema, type Account } from '@raisin/api-contracts/v1';
```

## Why versioned

A breaking schema change in `v1` would break every app that consumed the old shape. Adding `v2` alongside `v1` means apps migrate at their own pace, and the platform can deprecate `v1` after a deliberate window. CI gates breaking changes behind a `breaking-change-approved` label (see ADR 0004).

## Authoring rules

1. **Never edit a published schema.** Add a new version.
2. **Validate at the boundary.** `parse()` (or `safeParse()`) at the network edge, then trust the type internally.
3. **Co-locate fixtures + tests.** Every schema ships with `__tests__/<schema>.test.ts` covering known-good and known-bad payloads. Adding a field that breaks an existing fixture without a version bump fails CI.
