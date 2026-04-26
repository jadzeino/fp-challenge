import React from 'react';
import { CrossAppLink } from '@raisin/navigation';
import { useT } from '@raisin/common-i18n';
import { LocaleSwitcher } from '@raisin/design-system';

const UseCase1: React.FC = () => {
  const t = useT();
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

        <p style={{ marginTop: 32 }}>
          <CrossAppLink href="/app1">{t('home.go_app1')}</CrossAppLink>
        </p>
      </div>
    </div>
  );
};

export default UseCase1;
