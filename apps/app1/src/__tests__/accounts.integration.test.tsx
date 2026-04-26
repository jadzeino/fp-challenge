import * as React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { renderWithProviders } from '@raisin/testing';
import { server } from '@raisin/testing/msw/server';
import { I18nProvider } from '@raisin/common-i18n';
import en from '../../locales/en.json';
import de from '../../locales/de.json';
import AccountsPage from '../pages/accounts';

const wrapWithI18n = ({ children }: { children: React.ReactNode }) => (
  <I18nProvider app="app1" appResources={{ en, de }}>
    {children}
  </I18nProvider>
);

describe('app1 /accounts integration', () => {
  test('shows the unauthenticated message until the user logs in, then renders accounts', async () => {
    renderWithProviders(<AccountsPage />, { extraWrapper: wrapWithI18n });

    expect(screen.getByText(/not logged in/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    // After login, MSW returns the canonical fixtures and the table renders.
    await waitFor(() => expect(screen.getByText('Ada Lovelace')).toBeInTheDocument());
    expect(screen.getByText('Alan Turing')).toBeInTheDocument();
    expect(screen.getByText('Grace Hopper')).toBeInTheDocument();
  });

  test('surfaces a retryable error when the API returns 500', async () => {
    server.use(rest.get('*/v1/accounts', (_req, res, ctx) => res(ctx.status(500))));

    renderWithProviders(<AccountsPage />, { extraWrapper: wrapWithI18n });
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
