const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

// new CopyPlugin([
//   {
//     from: path.resolve(__dirname, 'src/distRelated'),
//     to: path.resolve(__dirname, 'dist'),
//   },
// ]),

// ChinaChronological: './src/components/ChinaChronological.js',
// PrefecturalChina: './src/components/PrefecturalChina.js',

module.exports = {
  mode: 'production',
  entry: {
    PrefecturalChina: './src/components/PrefecturalChinaRefactor.js',
    ChinaChronological: './src/components/ChinaChronological.js',
  },
  plugins: [
    new CleanWebpackPlugin(),
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
      {
        test: /\.svg$/,
        loader: 'svg-react-loader',
      },
    ],
  },
  externals: {
    react: 'react',
    'react-dom': 'react-dom',
    'styled-components': 'styled-components',
  },
};
