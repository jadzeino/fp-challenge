import * as React from 'react';
import { Html, Head, Main, NextScript, DocumentProps, DocumentContext } from 'next/document';
import {
  DocumentHeadTags,
  DocumentHeadTagsProps,
  documentGetInitialProps,
} from '@mui/material-nextjs/v13-pagesRouter';

export default function MyDocument(props: DocumentProps & DocumentHeadTagsProps) {
  return (
    <Html lang={props.locale}>
      <Head>
        <base href="/" />
        <DocumentHeadTags {...props} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

MyDocument.getInitialProps = async (ctx: DocumentContext) => {
  const initialProps = await documentGetInitialProps(ctx);
  return { ...initialProps, lang: ctx.locale };
};
