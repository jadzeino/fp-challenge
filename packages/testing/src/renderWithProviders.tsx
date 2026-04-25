import * as React from 'react';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
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
}

/**
 * RTL render wrapped in the platform's standard provider chain. Today
 * that is just <AuthProvider>; common-i18n and observability join the
 * chain in their respective commits without consumers needing to update
 * tests.
 */
export const renderWithProviders = (
  ui: React.ReactElement,
  { extraWrapper: Extra, ...opts }: RenderWithProvidersOptions = {},
): RenderResult =>
  render(ui, {
    wrapper: ({ children }) => (
      <AuthProvider>{Extra ? <Extra>{children}</Extra> : children}</AuthProvider>
    ),
    ...opts,
  });
