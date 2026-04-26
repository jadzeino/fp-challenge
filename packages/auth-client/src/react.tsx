import * as React from 'react';
import { createAuthClient } from './core';
import { createDefaultStorage } from './storage';
import type { AuthClient, AuthSession, AuthStatus, LoginCredentials } from './types';

interface AuthContextValue {
  client: AuthClient;
  session: AuthSession | null;
  status: AuthStatus;
  login: (credentials?: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  client?: AuthClient;
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ client: provided, children }) => {
  const clientRef = React.useRef<AuthClient | null>(null);
  if (!clientRef.current) {
    clientRef.current =
      provided ?? createAuthClient({ storage: createDefaultStorage(), mode: 'demo' });
  }
  const client = clientRef.current;

  const [session, setSession] = React.useState<AuthSession | null>(client.getSession());
  const [status, setStatus] = React.useState<AuthStatus>(client.getStatus());

  React.useEffect(() => {
    const unsubscribe = client.onChange((next) => {
      setSession(next);
      setStatus(client.getStatus());
    });
    return unsubscribe;
  }, [client]);

  const login = React.useCallback(
    async (credentials?: LoginCredentials) => {
      setStatus('authenticating');
      await client.login(credentials);
    },
    [client],
  );

  const logout = React.useCallback(async () => {
    await client.logout();
  }, [client]);

  const value = React.useMemo<AuthContextValue>(
    () => ({ client, session, status, login, logout }),
    [client, session, status, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};
