const cssnext = require('postcss-cssnext');
const cssnano = require('cssnano');

let plugins;

if (process.env.NODE_ENV === 'production') {
  plugins = [
    cssnext({
      features: {
        autoprefixer: false,
      },
    }),
    cssnano(),
  ];
} else {
  plugins = [cssnext()];
}

module.exports = {
  plugins,
};
