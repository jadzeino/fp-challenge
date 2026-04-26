module.exports = {
  ...require('@raisin/jest-preset'),
  rootDir: '.',
  displayName: 'app1',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['@testing-library/jest-dom', '<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    ...require('@raisin/jest-preset').moduleNameMapper,
    '\\.(css|less|sass|scss)$': '<rootDir>/jest.style-mock.js',
  },
};
