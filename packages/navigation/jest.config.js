module.exports = {
  ...require('@raisin/jest-preset'),
  rootDir: '.',
  displayName: 'navigation',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
};
