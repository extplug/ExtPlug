const path = require('path');
const env = process.env.NODE_ENV || 'production';

module.exports = {
  context: path.join(__dirname, './src'),
  entry: [
    'es6-symbol',
    'es6-shim',
    './ExtPlug.js',
  ],

  mode: env === 'development' ? 'development' : 'production',

  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'css-loader',
          'postcss-loader',
        ],
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
};
