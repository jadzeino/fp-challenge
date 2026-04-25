export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthSession {
  user: User;
  token: string;
  /** epoch milliseconds when the token becomes invalid */
  expiresAt: number;
}

export type AuthStatus = 'unauthenticated' | 'authenticating' | 'authenticated' | 'error';

export interface LoginCredentials {
  email?: string;
  password?: string;
}

export interface AuthStorage {
  get(): AuthSession | null;
  set(session: AuthSession | null): void;
  subscribe(listener: (session: AuthSession | null) => void): () => void;
}

export interface AuthClient {
  getStatus(): AuthStatus;
  getSession(): AuthSession | null;
  getToken(): string | null;
  login(credentials?: LoginCredentials): Promise<AuthSession>;
  logout(): Promise<void>;
  /**
   * Refreshes the token if it expires within `thresholdMs` (default 60s).
   * Returns the (possibly new) token, or null if not authenticated.
   */
  refreshIfExpiring(thresholdMs?: number): Promise<string | null>;
  onChange(listener: (session: AuthSession | null) => void): () => void;
}

export type AuthMode = 'demo' | 'production';

export interface CreateAuthClientOptions {
  storage: AuthStorage;
  mode?: AuthMode;
  /**
   * Token lifetime in milliseconds. Defaults to 5 minutes for demo mode.
   * Production mode reads expiry from the issued token.
   */
  tokenLifetimeMs?: number;
  /** Pluggable clock for tests. Defaults to Date.now. */
  now?: () => number;
}
