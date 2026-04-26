const StatoscopeWebpackPlugin = require('@statoscope/webpack-plugin').default;

const analyzeBundle = process.env.ANALYZE === 'true';

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: analyzeBundle,
});

// Path prefix served by the platform gateway. Same constant lives in
// platform/gateway/src/routes.config.ts; in production it would come from
// a shared registry. Keeping it explicit here so the app builds correctly
// even when run standalone.
const BASE_PATH = '/app1';

module.exports = withBundleAnalyzer({
  basePath: BASE_PATH,
  assetPrefix: BASE_PATH,
  experimental: {
    modularizeImports: {
      '@mui/material': {
        transform: '@mui/material/{{member}}',
      },
      '@mui/icons-material': {
        transform: '@mui/icons-material/{{member}}',
      },
      '@mui/lab': {
        transform: '@mui/lab/{{member}}',
      },
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...config.resolve.fallback,
          fs: false,
        },
      };
    }

    if (analyzeBundle) {
      config.plugins.push(new StatoscopeWebpackPlugin());
    }

    return config;
  },
});
