import { createAuthClient } from '../core';
import { createMemoryStorage } from '../storage';

const fixedNow = (ts: number) => () => ts;

describe('createAuthClient (demo mode)', () => {
  test('starts unauthenticated when storage is empty', () => {
    const auth = createAuthClient({ storage: createMemoryStorage() });
    expect(auth.getStatus()).toBe('unauthenticated');
    expect(auth.getToken()).toBeNull();
  });

  test('login stores a session and exposes a token', async () => {
    const auth = createAuthClient({
      storage: createMemoryStorage(),
      now: fixedNow(1_700_000_000_000),
    });
    const session = await auth.login({ email: 'ada@raisin.test' });
    expect(session.user.email).toBe('ada@raisin.test');
    expect(auth.getToken()).toBe(session.token);
    expect(auth.getStatus()).toBe('authenticated');
  });

  test('logout clears the session and notifies subscribers', async () => {
    const storage = createMemoryStorage();
    const auth = createAuthClient({ storage });
    await auth.login();
    const events: Array<unknown> = [];
    auth.onChange((s) => events.push(s));
    await auth.logout();
    expect(auth.getSession()).toBeNull();
    expect(events.at(-1)).toBeNull();
  });

  test('refreshIfExpiring returns the current token when not near expiry', async () => {
    const t0 = 1_700_000_000_000;
    const auth = createAuthClient({
      storage: createMemoryStorage(),
      now: fixedNow(t0),
      tokenLifetimeMs: 5 * 60 * 1000,
    });
    await auth.login();
    const original = auth.getToken();
    // 60s default threshold; we are at t0 with 5min TTL -> not expiring
    const next = await auth.refreshIfExpiring();
    expect(next).toBe(original);
  });

  test('refreshIfExpiring re-issues the token when within the threshold', async () => {
    let t = 1_700_000_000_000;
    const auth = createAuthClient({
      storage: createMemoryStorage(),
      now: () => t,
      tokenLifetimeMs: 5 * 60 * 1000,
    });
    await auth.login({ email: 'turing@raisin.test' });
    const before = auth.getToken();
    // advance the clock to 30s before expiry; default threshold is 60s
    t += 5 * 60 * 1000 - 30 * 1000;
    const after = await auth.refreshIfExpiring();
    expect(after).not.toBeNull();
    expect(after).not.toBe(before);
    expect(auth.getSession()?.user.email).toBe('turing@raisin.test');
  });

  test('refreshIfExpiring returns null when no session exists', async () => {
    const auth = createAuthClient({ storage: createMemoryStorage() });
    expect(await auth.refreshIfExpiring()).toBeNull();
  });

  test('production mode throws until OIDC/PKCE lands (ADR 0003)', async () => {
    const auth = createAuthClient({ storage: createMemoryStorage(), mode: 'production' });
    await expect(auth.login()).rejects.toThrow(/production auth mode is not implemented/);
  });
});
