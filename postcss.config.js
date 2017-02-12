const imports = require('postcss-import');
const cssnext = require('postcss-cssnext');
const cssnano = require('cssnano');

const plugins = [
  imports(),
];

if (process.env.NODE_ENV === 'production') {
  plugins.push(
    cssnext({
      features: {
        autoprefixer: false,
      },
    }));
  plugins.push(cssnano());
} else {
  plugins.push(cssnext());
}

module.exports = {
  plugins,
};
