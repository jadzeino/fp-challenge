import type { AuthSession, LoginCredentials } from './types';

/**
 * Demo-mode token issuer. Produces a deterministic, opaque token so the
 * end-to-end auth flow runs without a real IdP. The token is decorative
 * (the gateway and api-client do not validate it cryptographically); its
 * shape is JWT-like so logs and devtools look familiar.
 *
 * The production replacement is documented in ADR 0003: OIDC/PKCE with
 * refresh-token rotation, optionally fronted by a per-market BFF.
 */

const base64url = (input: string): string => {
  const b64 =
    typeof Buffer !== 'undefined' ? Buffer.from(input, 'utf8').toString('base64') : btoa(input);
  return b64.replace(/=+$/u, '').replace(/\+/gu, '-').replace(/\//gu, '_');
};

const issueDemoToken = (subject: string, expiresAt: number): string => {
  const header = base64url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const payload = base64url(
    JSON.stringify({ sub: subject, iat: Date.now(), exp: Math.floor(expiresAt / 1000) }),
  );
  return `${header}.${payload}.demo`;
};

export const createDemoSession = (
  credentials: LoginCredentials | undefined,
  now: number,
  lifetimeMs: number,
): AuthSession => {
  const email = credentials?.email?.trim() || 'demo@raisin.test';
  return {
    user: {
      id: `demo-${email}`,
      email,
      name: email.split('@')[0] || 'Demo User',
    },
    token: issueDemoToken(email, now + lifetimeMs),
    expiresAt: now + lifetimeMs,
  };
};
