# @raisin/auth-client

Token management, refresh, and request injection for Raisin frontend apps. Framework-agnostic core; React adapter is a separate subpath import so non-React consumers do not pay for it.

## Two layers

```ts
// 1. Framework-agnostic core
import { createAuthClient, createDefaultStorage } from '@raisin/auth-client';

const auth = createAuthClient({
  storage: createDefaultStorage(), // localStorage in browser, memory on server
  mode: 'demo',
});

await auth.login({ email: 'demo@raisin.test' });
const token = auth.getToken(); // -> "<jwt>.demo"
```

```tsx
// 2. React adapter (subpath: @raisin/auth-client/react)
import { AuthProvider, useAuth } from '@raisin/auth-client/react';

function App({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}

function LoginButton() {
  const { status, login, logout, session } = useAuth();
  if (session) return <button onClick={logout}>Log out {session.user.email}</button>;
  return <button disabled={status === 'authenticating'} onClick={() => login()}>Log in</button>;
}
```

## Demo vs production mode

Demo mode (the default while the take-home runs) issues a deterministic mock JWT with a 5-minute TTL so the auth -> API -> UI flow can be exercised end-to-end without a real IdP. `refreshIfExpiring()` re-issues the token when it is within 60s of expiry.

Production mode is intentionally a `throw` until the OIDC/PKCE replacement lands (see ADR 0003). This keeps callers honest about what is and is not real.

## What this prevents

Every Raisin app would otherwise reinvent: token storage, cross-tab sync, refresh-before-expiry, and a React context for status. Consolidating means one team owns the security-sensitive surface and can roll out OIDC/PKCE + BFF without touching app code.
