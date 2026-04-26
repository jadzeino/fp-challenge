const path = require('path');

/**
 * Shared Jest preset for the Raisin platform.
 *
 * Apps and packages opt in via:
 *
 *   // jest.config.js
 *   module.exports = {
 *     ...require('@raisin/jest-preset'),
 *     // package-specific overrides go here
 *   };
 *
 * The preset is environment-agnostic by default (node). React packages
 * that need DOM globals override testEnvironment: 'jsdom' in their own
 * config.
 *
 * @raisin/* are mapped to their source files so tests run against the
 * latest in-tree code without rebuilding the workspace libs first.
 * Paths are resolved relative to this file (in packages/jest-preset/)
 * so the mapping works for any consumer location, not just packages/*.
 */
const PACKAGES = path.resolve(__dirname, '..');

module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        // Force JSX -> JS transform regardless of the consumer tsconfig
        // (Next apps use jsx: "preserve" which leaves <Tag/> in the output
        // and breaks Jest's parser).
        tsconfig: { jsx: 'react', esModuleInterop: true, isolatedModules: true },
        diagnostics: { ignoreCodes: [151001] },
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)', '**/*.test.(ts|tsx)'],
  testPathIgnorePatterns: ['/node_modules/', '/lib/', '/.next/'],
  // Packages without tests (yet) should not fail nx run-many --target=test;
  // a missing test is a nudge to add one, not a hard error in the suite.
  passWithNoTests: true,
  clearMocks: true,
  resetMocks: false,
  restoreMocks: true,
  moduleNameMapper: {
    '^@raisin/api-contracts$': path.join(PACKAGES, 'api-contracts/src/index.ts'),
    '^@raisin/api-contracts/v1$': path.join(PACKAGES, 'api-contracts/src/v1/index.ts'),
    '^@raisin/auth-client$': path.join(PACKAGES, 'auth-client/src/index.ts'),
    '^@raisin/auth-client/react$': path.join(PACKAGES, 'auth-client/src/react.tsx'),
    '^@raisin/api-client$': path.join(PACKAGES, 'api-client/src/index.ts'),
    '^@raisin/design-tokens$': path.join(PACKAGES, 'design-tokens/src/index.ts'),
    '^@raisin/design-system$': path.join(PACKAGES, 'design-system/src/index.ts'),
    '^@raisin/common-i18n$': path.join(PACKAGES, 'common-i18n/src/index.ts'),
    '^@raisin/observability$': path.join(PACKAGES, 'observability/src/index.ts'),
    '^@raisin/observability/react$': path.join(PACKAGES, 'observability/src/react.tsx'),
    '^@raisin/observability/node$': path.join(PACKAGES, 'observability/src/node.ts'),
    '^@raisin/testing$': path.join(PACKAGES, 'testing/src/index.ts'),
    '^@raisin/testing/msw$': path.join(PACKAGES, 'testing/src/msw/index.ts'),
    '^@raisin/testing/msw/server$': path.join(PACKAGES, 'testing/src/msw/server.ts'),
    '^@raisin/testing/msw/browser$': path.join(PACKAGES, 'testing/src/msw/browser.ts'),
  },
};
