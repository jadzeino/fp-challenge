import React from 'react';
import Head from 'next/head';
import { AppCacheProvider } from '@mui/material-nextjs/v13-pagesRouter';
import { AppProps } from 'next/app';
import { AuthProvider } from '@raisin/auth-client/react';
import { I18nProvider } from '@raisin/common-i18n';
import { initObservability } from '@raisin/observability';
import { ErrorBoundary } from '@raisin/observability/react';

import { getAuth } from '../platform/api';
import en from '../../locales/en.json';
import de from '../../locales/de.json';

import './styles.css';

const APP_NAME = 'app1';

initObservability({
  app: APP_NAME,
  env: (process.env.NODE_ENV as 'development' | 'production' | 'test') ?? 'development',
  release: process.env.NEXT_PUBLIC_RELEASE,
});

const App = (props: AppProps) => {
  const { Component, pageProps } = props;
  return (
    <ErrorBoundary>
      <AppCacheProvider {...props}>
        <Head>
          <link rel="icon" href="/assets/favicon.ico" />
        </Head>

        <AuthProvider client={getAuth()}>
          <I18nProvider app={APP_NAME} appResources={{ en, de }}>
            <Component {...pageProps} />
          </I18nProvider>
        </AuthProvider>
      </AppCacheProvider>
    </ErrorBoundary>
  );
};

export default App;
