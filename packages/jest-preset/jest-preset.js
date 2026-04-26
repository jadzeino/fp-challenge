/**
 * Shared Jest preset for the Raisin platform.
 *
 * Apps and packages opt in via:
 *
 *   // jest.config.js
 *   module.exports = {
 *     ...require('@raisin/testing/jest-preset'),
 *     // package-specific overrides go here
 *   };
 *
 * The preset is environment-agnostic by default (node). React packages
 * that need DOM globals override testEnvironment: 'jsdom' in their own
 * config.
 */
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
        isolatedModules: true,
        diagnostics: { ignoreCodes: [151001] },
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)', '**/*.test.(ts|tsx)'],
  testPathIgnorePatterns: ['/node_modules/', '/lib/', '/.next/'],
  clearMocks: true,
  resetMocks: false,
  restoreMocks: true,
  // ts-jest by default does not resolve workspace deps via "exports"; map
  // @raisin/* to source so tests use up-to-date code without rebuilding libs.
  moduleNameMapper: {
    '^@raisin/api-contracts$': '<rootDir>/../api-contracts/src/index.ts',
    '^@raisin/api-contracts/v1$': '<rootDir>/../api-contracts/src/v1/index.ts',
    '^@raisin/auth-client$': '<rootDir>/../auth-client/src/index.ts',
    '^@raisin/auth-client/react$': '<rootDir>/../auth-client/src/react.tsx',
    '^@raisin/api-client$': '<rootDir>/../api-client/src/index.ts',
    '^@raisin/design-tokens$': '<rootDir>/../design-tokens/src/index.ts',
    '^@raisin/design-system$': '<rootDir>/../design-system/src/index.ts',
    '^@raisin/common-i18n$': '<rootDir>/../common-i18n/src/index.ts',
    '^@raisin/observability$': '<rootDir>/../observability/src/index.ts',
    '^@raisin/testing$': '<rootDir>/../testing/src/index.ts',
    '^@raisin/testing/(.*)$': '<rootDir>/../testing/src/$1',
  },
};
