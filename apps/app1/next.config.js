const StatoscopeWebpackPlugin = require('@statoscope/webpack-plugin').default;

const analyzeBundle = process.env.ANALYZE === 'true';

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: analyzeBundle,
});

module.exports = withBundleAnalyzer({
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
