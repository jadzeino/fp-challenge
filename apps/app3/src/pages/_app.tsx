import React from 'react';
import Head from 'next/head';
import { AppCacheProvider } from '@mui/material-nextjs/v13-pagesRouter';
import { AppProps } from 'next/app';
import { I18nProvider } from '@raisin/common-i18n';
import { initObservability } from '@raisin/observability';
import { ErrorBoundary } from '@raisin/observability/react';

import en from '../../locales/en.json';
import de from '../../locales/de.json';

import './styles.css';

const APP_NAME = 'app3';

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

        <I18nProvider app={APP_NAME} appResources={{ en, de }}>
          <Component {...pageProps} />
        </I18nProvider>
      </AppCacheProvider>
    </ErrorBoundary>
  );
};

export default App;
