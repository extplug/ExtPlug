const path = require('path');
const UglifyJsPlugin = require('webpack').UglifyJsPlugin;

const env = process.env.NODE_ENV || 'development';

module.exports = {
  context: path.join(__dirname, './src'),
  entry: [
    'es6-symbol',
    'es6-shim',
    './ExtPlug',
  ],

  module: {
    rules: [
      {
        include: [path.join(__dirname, 'src/ExtPlug')],
        use: 'flat-loader',
      },
      {
        test: /\.css$/,
        use: [
          'css-loader',
          'postcss-loader',
        ],
      },
      {
        test: /\.json$/,
        use: 'json-loader',
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\.png$/,
        loader: 'url-loader',
        options: { limit: -1 },
      },
    ],
  },

  output: {
    path: path.join(__dirname, './build'),
    filename: 'source.js',
    library: 'extplug/__internalExtPlug__',
    libraryTarget: 'amd',
  },

  resolve: {
    alias: {
      extplug: path.join(__dirname, './src'),
    },
  },

  externals: [
    'jquery',
    'underscore',
    'backbone',
    'plug-modules',
    'lang/Lang',
    (context, request, cb) => {
      if (/^plug\//.test(request)) {
        cb(null, `amd plug-modules!${request}`);
      } else {
        cb();
      }
    },
  ],

  plugins: [
    env === 'production' && new UglifyJsPlugin(),
  ].filter(Boolean),
};
