/**
 * Created by msills on 1/11/17.
 */
const path = require('path')
const nodeExternals = require('webpack-node-externals')

const env = process.env.NODE_ENV || 'development'
const DEV = env === 'development'

const config = {
  entry: ['./index'],
  output: {
    path: path.join(__dirname, '/build'),
    filename: 'bundle.js',
    libraryTarget: 'umd'
  },
  node: {
    __filename: true,
    __dirname: true
  },
  target: 'node',
  externals: [
    nodeExternals()
  ],
  resolve: {
    extensions: ['.js']
  },
  devtool: 'source-map',
  plugins: [],
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      }
    ]
  }
}

if (DEV) {
  config.devtool = 'source-map'
}

module.exports = config
