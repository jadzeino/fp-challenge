module.exports = {
  ...require('@raisin/jest-preset'),
  rootDir: '.',
  displayName: 'design-system',
  testEnvironment: 'jsdom',
  setupFilesAfterEach: ['@testing-library/jest-dom'],
};
