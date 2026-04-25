import { Html, Head, Main, NextScript, DocumentProps, DocumentContext } from 'next/document';
import * as React from 'react';
import { ServerStyleSheets } from '@mui/styles';
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
  const materialUiSheets = new ServerStyleSheets();
  const originalRenderPage = ctx.renderPage;

  ctx.renderPage = () =>
    originalRenderPage({
      enhanceApp: (App) => (props) => materialUiSheets.collect(<App {...props} />),
    });

  const initialProps = await documentGetInitialProps(ctx);
  const lang = ctx.locale;

  return {
    ...initialProps,
    lang,
    styles: [
      <React.Fragment key="styles">
        {initialProps.styles}
        {materialUiSheets.getStyleElement()}
      </React.Fragment>,
    ],
  };
};
