import React from 'react';
import { useAuth } from '@raisin/auth-client/react';
import { useT } from '@raisin/common-i18n';
import { LocaleSwitcher } from '@raisin/design-system';
import type { v1 } from '@raisin/api-contracts';
import { logger } from '@raisin/observability';

import { getApi } from '../../platform/api';

const UseCase1: React.FC = () => {
  const t = useT();
  const { session } = useAuth();
  const [first, setFirst] = React.useState<v1.Account | null>(null);

  React.useEffect(() => {
    if (!session) {
      setFirst(null);
      return;
    }
    getApi()
      .accounts.list()
      .then((accounts) => setFirst(accounts[0] ?? null))
      .catch((err) => logger.error('app2_accounts_failed', err));
  }, [session]);

  return (
    <div className="wrapper">
      <div className="container">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>
            <span>{t('home.subtitle')}</span>
            {t('home.title')}
          </h1>
          <LocaleSwitcher />
        </header>

        <section style={{ marginTop: 24 }}>
          {!session && <p>{t('session.go_login')}</p>}
          {session && (
            <>
              <p>{t('session.shared_intro')}</p>
              <p>{t('session.logged_in_as', { email: session.user.email })}</p>
              {first && (
                <p>
                  <strong>{t('session.first_account')}:</strong> {first.holder} —{' '}
                  <code>{first.iban}</code>
                </p>
              )}
            </>
          )}
        </section>

        <p style={{ marginTop: 32 }}>
          <a href="/app1">{t('home.go_app1')}</a>
        </p>
      </div>
    </div>
  );
};

export default UseCase1;
