module.exports = {
  presets: [['@babel/preset-env', { modules: false }], '@babel/preset-react'],
  // enables us to create custom .babelrc configs for each FE app
  babelrcRoots: ['.', 'packages/*'],
  plugins: ['react-hot-loader/babel', '@babel/plugin-proposal-class-properties'],
};
