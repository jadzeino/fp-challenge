const StatoscopeWebpackPlugin = require('@statoscope/webpack-plugin').default;

const analyzeBundle = process.env.ANALYZE === 'true';

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: analyzeBundle,
});

const BASE_PATH = '/app3';

module.exports = withBundleAnalyzer({
  basePath: BASE_PATH,
  assetPrefix: BASE_PATH,
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
