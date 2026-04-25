# @raisin/api-client

Auth-aware typed API client built on `@raisin/api-contracts`. Apps consume this client; they never call `fetch` directly.

## Usage

```ts
import { createApiClient } from '@raisin/api-client';
import { createAuthClient, createDefaultStorage } from '@raisin/auth-client';

const auth = createAuthClient({ storage: createDefaultStorage() });
const api = createApiClient({ baseUrl: '/api', auth });

const accounts = await api.accounts.list();
//     ^? v1.Account[]
```

## What you get for free

- **Auth injection**: `auth.refreshIfExpiring()` runs before every request; `Authorization: Bearer <token>` is added when a session exists.
- **Retry on 401**: a single retry with a forced refresh covers the common case of a token expiring between the refresh check and the request landing at the API.
- **Contract validation**: the response is `safeParse`d against the schema from api-contracts. A drift between server and contract becomes a typed error in the client, not a `cannot read property of undefined` deep in the UI.
- **Request tracing**: every request gets an `X-Request-ID` header; the gateway and observability layer use it to correlate logs across zones.
- **Typed errors**: `ApiError` carries `resource`, `requestId`, `status`, and `cause` — wired to `@raisin/observability` via the `onError` hook.

## Adding a resource

1. Add the schema to `@raisin/api-contracts/v1/<resource>.ts`.
2. Add a resource module under `src/resources/<resource>.ts` exporting `createXResource(request)`.
3. Wire it in `src/client.ts`.
4. Add a contract test in `@raisin/api-contracts/src/__tests__/<resource>.test.ts`.

The pattern is intentionally repetitive so a code-gen step (`pnpm gen resource`) can replace it later without disrupting the public API.
