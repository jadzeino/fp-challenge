module.exports = {
  ...require('@raisin/testing/jest-preset'),
  rootDir: '.',
  displayName: 'app1',
  testEnvironment: 'jsdom',
  setupFilesAfterEach: ['@testing-library/jest-dom'],
  setupFiles: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    ...require('@raisin/testing/jest-preset').moduleNameMapper,
    '\\.(css|less|sass|scss)$': '<rootDir>/jest.style-mock.js',
  },
};
