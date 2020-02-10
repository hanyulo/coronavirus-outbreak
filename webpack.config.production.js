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
  externals: {
    'styled-components': {
      commonjs2: 'styled-components',
      amd: 'styled-components',
    },
    react: {
      commonjs2: 'react',
      amd: 'react',
    },
    'react-dom': {
      commonjs2: 'react-dom',
      amd: 'react-dom',
    },
  },
};
