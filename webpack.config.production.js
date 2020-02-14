const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    ChinaChronological: './src/components/ChinaChronological.js',
    PrefecturalChina: './src/components/PrefecturalChina.js',
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyPlugin([
      {
        from: path.resolve(__dirname, 'src/distRelated'),
        to: path.resolve(__dirname, 'dist'),
      },
    ]),

  ],
  output: {
    filename: '[name].js',
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
    react: 'react',
    'react-dom': 'react-dom',
    'styled-components': 'styled-components',
  },
};
