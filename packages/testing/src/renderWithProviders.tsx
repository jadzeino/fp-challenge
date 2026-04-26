import * as React from 'react';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { createAuthClient, createMemoryStorage, type AuthClient } from '@raisin/auth-client';
import { AuthProvider } from '@raisin/auth-client/react';

export interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  /**
   * Optional extra wrapper composed inside the platform providers, e.g.
   *
   *   renderWithProviders(<UI/>, { extraWrapper: ({ children }) =>
   *     <MyDomainProvider>{children}</MyDomainProvider>
   *   })
   */
  extraWrapper?: React.ComponentType<{ children: React.ReactNode }>;
  /**
   * Optional pre-built auth client. Defaults to a fresh memory-backed
   * client per render so tests stay isolated (the default localStorage
   * client would leak session state across tests).
   */
  authClient?: AuthClient;
}

export const renderWithProviders = (
  ui: React.ReactElement,
  { extraWrapper: Extra, authClient, ...opts }: RenderWithProvidersOptions = {},
): RenderResult => {
  const client = authClient ?? createAuthClient({ storage: createMemoryStorage(), mode: 'demo' });
  return render(ui, {
    wrapper: ({ children }) => (
      <AuthProvider client={client}>
        {Extra ? <Extra>{children}</Extra> : children}
      </AuthProvider>
    ),
    ...opts,
  });
};
