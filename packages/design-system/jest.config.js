module.exports = {
  ...require('@raisin/testing/jest-preset'),
  rootDir: '.',
  displayName: 'design-system',
  testEnvironment: 'jsdom',
  setupFilesAfterEach: ['@testing-library/jest-dom'],
};
