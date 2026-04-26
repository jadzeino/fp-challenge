# ADR 0010 — Cross-zone shared state strategy

- Status: accepted
- Date: 2026-04-26

## Context

The platform runs three independent Next.js apps behind a single-origin gateway. Apps navigate between each other via hard full-page navigations — they never run concurrently in the same browser context. Any state that must survive a zone hop (app1 → app2 → app3) or stay consistent across multiple open tabs cannot live in React component state or an in-memory store; it needs a durable, origin-scoped mechanism.

Two pieces of shared state are already live: the auth session (`localStorage`) and the locale (`cookie`). As the platform grows, more cross-zone state will emerge — user preferences, feature flags, notifications, transient wizard steps — and without a deliberate strategy each team will pick a different mechanism, creating drift and hard-to-debug inconsistencies.

## Decision

Shared state is classified into four tiers. Each tier has a canonical mechanism and a rule for when to use it.

---

### Tier 1 — Cookie (`Path=/; SameSite=Lax`)

**Use for:** state that the server needs to see on the initial request (locale, A/B cohort, session hint for SSR).

**Properties:** sent automatically on every request to the origin regardless of path; survives hard navigations and browser restarts; readable by server-side `getServerSideProps`; limited to ~4 KB.

**Current usage:** `raisin-locale` in `@raisin/common-i18n`.

**Rule:** only use a cookie when the server needs the value before the first render. For purely client-side state, prefer `localStorage` to avoid inflating every request with unnecessary header bytes.

---

### Tier 2 — `localStorage` with change subscription

**Use for:** auth session, user preferences (theme, density), feature-flag overrides, any state that must persist across browser sessions and is read only after hydration.

**Properties:** origin-scoped (`https://raisin.com` shares one namespace across all paths); synchronous read; survives navigations and restarts; not sent to the server; limited to ~5–10 MB; cross-tab sync via the `storage` event.

**Current usage:** `raisin.auth.session` in `@raisin/auth-client`.

**Pattern to follow — pluggable storage abstraction:**

```ts
// packages/<feature>-client/src/storage.ts
export interface FeatureStorage {
  get(): State | null;
  set(next: State | null): void;
  subscribe(listener: (s: State | null) => void): () => void;
}

export const createLocalStorageStorage = (): FeatureStorage => { /* ... */ };
export const createMemoryStorage = (): FeatureStorage => { /* ... (SSR safe) */ };
export const createDefaultStorage = (): FeatureStorage =>
  typeof window !== 'undefined' ? createLocalStorageStorage() : createMemoryStorage();
```

Every new piece of cross-zone state that belongs in Tier 2 gets its own `@raisin/<feature>-client` package with this interface. Apps consume a `<FeatureProvider>` and a `useFeature()` hook; they never read `localStorage` directly.

**Naming convention for localStorage keys:** `raisin.<feature>.<field>` (e.g. `raisin.auth.session`, `raisin.prefs.theme`). Prevents collisions if a third-party script also writes to localStorage.

---

### Tier 3 — `BroadcastChannel`

**Use for:** real-time signals that need to fire across tabs but do not need to be persisted (logout broadcast, "session expired" banner, tab-to-tab cursor position in a collaborative feature).

**Properties:** message-passing only, no storage; fires across all tabs of the same origin in real time; not persisted (a new tab opening after the message is sent misses it); no IE11 support (irrelevant for Raisin's target browser matrix).

**When to reach for it over the `storage` event:** the `storage` event fires only when a key is written from a *different* tab — it does not fire in the originating tab. `BroadcastChannel` fires in all tabs including the sender, which is the right behaviour for events like "user just clicked logout."

**Example:**

```ts
const channel = new BroadcastChannel('raisin.auth');
channel.postMessage({ type: 'LOGOUT' });

channel.onmessage = (e) => {
  if (e.data.type === 'LOGOUT') auth.logout();
};
```

`@raisin/auth-client` currently uses `storage` events for cross-tab sync. A future iteration will layer `BroadcastChannel` on top for the logout broadcast while keeping `storage` events as the fallback for persistence.

---

### Tier 4 — Server-push (WebSocket / SSE through the gateway)

**Use for:** real-time server-authoritative state — notification counts, live order status, price updates, feature-flag changes pushed by ops.

**Properties:** the gateway already handles WebSocket proxying (`ws: true` in `http-proxy-middleware`); each app opens its own connection to a shared notifications/events service; the gateway adds the `X-Request-ID` correlation header.

**Pattern:** a `@raisin/realtime-client` package (not yet built) wraps the WebSocket/SSE connection and exposes the same `subscribe` interface as Tier 2 storage. Apps do not open raw WebSocket connections.

**Rule:** never use Tier 4 for state that could be Tier 1–3. WebSocket connections are expensive and add operational complexity. Feature flags, for example, can be fetched on app load (HTTP) and then pushed on change (SSE) — the push is Tier 4 but the initial read is Tier 2 with a TTL-based cache.

---

### Decision matrix

| State | Tier | Mechanism | Example |
|---|---|---|---|
| Locale | 1 | Cookie `Path=/` | `raisin-locale` |
| Auth session / token | 2 | localStorage + storage event | `raisin.auth.session` |
| User preferences | 2 | localStorage | `raisin.prefs.*` |
| Feature flags | 2 + Tier 4 push | localStorage with TTL + SSE invalidation | `raisin.flags.*` |
| Logout broadcast | 3 | BroadcastChannel | `raisin.auth` channel |
| Notification count | 4 | WebSocket / SSE | `raisin.notifications` |
| Wizard / checkout step | URL params or sessionStorage | — | Not shared cross-zone |

---

### What does NOT belong in shared state

- **UI state** (modal open, accordion expanded) — lives in component state.
- **Server cache** (fetched accounts list) — lives in React Query / SWR cache, re-fetched on mount.
- **Form draft** — `sessionStorage`, scoped to the tab, never crosses a zone.

## Consequences

- All cross-zone state is explicitly classified. Reviewers can reject a PR that reaches directly into `localStorage` without going through a `@raisin/*-client` package.
- The pluggable storage abstraction (established by `auth-client`) is the canonical pattern. SSR safety and test isolation come for free because the server always gets `createMemoryStorage()`.
- `BroadcastChannel` is the approved channel for cross-tab events; raw `storage` event listeners outside of a storage adapter are banned.
- Adding a new piece of shared state requires a deliberate decision about which tier it belongs to — not just "shove it in localStorage."

## Alternatives considered

- **Redux / Zustand global store** — stores are in-memory and reset on hard navigation; not viable for cross-zone state.
- **Shared iframe shell with postMessage** — would allow in-memory state sharing but requires all apps to run inside an orchestrating shell, coupling deployment and breaking independent deployability. Rejected.
- **Module Federation (Webpack 5)** — shares runtime code across apps in the same page load. Requires all apps to be on screen simultaneously (micro-frontend shell model). Not compatible with our path-based hard-navigation model without significant architectural change.
- **Third-party state sync service (e.g. Replicache, PartyKit)** — over-engineered for the current scale; revisit at 10+ apps with collaborative features.
