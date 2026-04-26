import React from 'react';
import Head from 'next/head';
import { useAuth } from '@raisin/auth-client/react';
import { useT } from '@raisin/common-i18n';
import { Button, LocaleSwitcher } from '@raisin/design-system';
import type { v1 } from '@raisin/api-contracts';
import { logger } from '@raisin/observability';

import { getApi } from '../platform/api';

type LoadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; data: v1.AccountList }
  | { status: 'error'; message: string };

const formatBalance = (n: number, currency: v1.CurrencyCode): string =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(n);

const formatDate = (iso: string): string =>
  new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(iso));

const AccountsPage: React.FC = () => {
  const t = useT();
  const { session, status, login, logout } = useAuth();
  const [load, setLoad] = React.useState<LoadState>({ status: 'idle' });

  const refresh = React.useCallback(async () => {
    setLoad({ status: 'loading' });
    try {
      const data = await getApi().accounts.list();
      setLoad({ status: 'ready', data });
    } catch (err) {
      logger.error('accounts_load_failed', err, { app: 'app1' });
      setLoad({ status: 'error', message: t('accounts.load_error') });
    }
  }, [t]);

  React.useEffect(() => {
    if (session) refresh();
    else setLoad({ status: 'idle' });
    // refresh is intentionally excluded - it depends on t() which we want
    // to be stable; including it would re-fire on every render. The session
    // identity is the meaningful trigger for re-fetching.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  return (
    <>
      <Head>
        <title>{t('accounts.title')}</title>
      </Head>
      <div className="wrapper">
        <div className="container">
          <header
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              justifyContent: 'space-between',
            }}
          >
            <h1>{t('accounts.title')}</h1>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <LocaleSwitcher />
              {session ? (
                <Button variant="outlined" onClick={logout}>
                  {t('actions.logout')} ({session.user.email})
                </Button>
              ) : (
                <Button
                  variant="contained"
                  disabled={status === 'authenticating'}
                  onClick={() => login({ email: 'demo@raisin.test' })}
                >
                  {t('actions.login')}
                </Button>
              )}
            </div>
          </header>

          {!session && <p>{t('common.unauthenticated')}</p>}
          {load.status === 'loading' && <p>{t('common.loading')}</p>}
          {load.status === 'error' && (
            <p role="alert">
              {load.message}{' '}
              <Button variant="text" onClick={refresh}>
                {t('actions.retry')}
              </Button>
            </p>
          )}
          {load.status === 'ready' && load.data.length === 0 && <p>{t('accounts.empty')}</p>}
          {load.status === 'ready' && load.data.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 24 }}>
              <thead>
                <tr>
                  <th align="left">{t('accounts.columns.holder')}</th>
                  <th align="left">{t('accounts.columns.iban')}</th>
                  <th align="right">{t('accounts.columns.balance')}</th>
                  <th align="left">{t('accounts.columns.openedAt')}</th>
                </tr>
              </thead>
              <tbody>
                {load.data.map((a) => (
                  <tr key={a.id}>
                    <td>{a.holder}</td>
                    <td>
                      <code>{a.iban}</code>
                    </td>
                    <td align="right">{formatBalance(a.balance, a.currency)}</td>
                    <td>{formatDate(a.openedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
};

export default AccountsPage;
