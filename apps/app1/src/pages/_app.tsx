import React from 'react';
import Head from 'next/head';
import { AppCacheProvider } from '@mui/material-nextjs/v13-pagesRouter';
import { AppProps } from 'next/app';

import './styles.css';

const App = (props: AppProps) => {
  const { Component, pageProps } = props;
  return (
    <AppCacheProvider {...props}>
      <Head>
        <link rel="icon" href="/assets/favicon.ico" />
      </Head>

      <Component {...pageProps} />
    </AppCacheProvider>
  );
};

export default App;
