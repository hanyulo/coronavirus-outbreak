const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');


module.exports = {
  mode: 'production',
  entry: {
    ChinaChronological: './src/components/ChinaChronological.js',
  },
  plugins: [
    new CleanWebpackPlugin(),
  ],
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'commonjs2',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
    ],
  },
  resolve: {
    alias: {
      react: path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    },
  },
  externals: {
    'styled-components': {
      commonjs: 'styled-components',
      commonjs2: 'styled-components',
      amd: 'StyledComponents',
      root: 'StyledComponents',
    },
    react: {
      commonjs: 'react',
      commonjs2: 'react',
      amd: 'React',
      root: 'React',
    },
    'react-dom': {
      commonjs: 'react-dom',
      commonjs2: 'react-dom',
      amd: 'ReactDOM',
      root: 'ReactDOM',
    },
  },
};
