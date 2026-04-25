import type {
  AuthClient,
  AuthSession,
  AuthStatus,
  CreateAuthClientOptions,
  LoginCredentials,
} from './types';
import { createDemoSession } from './demo';

const DEFAULT_LIFETIME_MS = 5 * 60 * 1000;
const DEFAULT_REFRESH_THRESHOLD_MS = 60 * 1000;

export const createAuthClient = (opts: CreateAuthClientOptions): AuthClient => {
  const { storage, mode = 'demo', tokenLifetimeMs = DEFAULT_LIFETIME_MS, now = Date.now } = opts;

  let status: AuthStatus = storage.get() ? 'authenticated' : 'unauthenticated';

  const setSession = (session: AuthSession | null): void => {
    storage.set(session);
    status = session ? 'authenticated' : 'unauthenticated';
  };

  const isExpired = (session: AuthSession, threshold = 0): boolean =>
    session.expiresAt - now() <= threshold;

  const issue = async (credentials?: LoginCredentials): Promise<AuthSession> => {
    if (mode === 'demo') {
      return createDemoSession(credentials, now(), tokenLifetimeMs);
    }
    // Production: handed off to OIDC/PKCE flow (see ADR 0003). Until that
    // lands, throwing keeps callers honest about what is and isn't real.
    throw new Error('production auth mode is not implemented; use mode: "demo" for now');
  };

  return {
    getStatus: () => status,
    getSession: () => storage.get(),
    getToken: () => storage.get()?.token ?? null,

    async login(credentials) {
      status = 'authenticating';
      try {
        const session = await issue(credentials);
        setSession(session);
        return session;
      } catch (err) {
        status = 'error';
        throw err;
      }
    },

    async logout() {
      setSession(null);
    },

    async refreshIfExpiring(thresholdMs = DEFAULT_REFRESH_THRESHOLD_MS) {
      const session = storage.get();
      if (!session) return null;
      if (!isExpired(session, thresholdMs)) return session.token;
      // For demo mode we re-issue a token. For production this is where
      // refresh-token rotation lives.
      const next = await issue({ email: session.user.email });
      setSession(next);
      return next.token;
    },

    onChange: (listener) => storage.subscribe(listener),
  };
};
