const path = require('path');
const fs = require('fs');
const gulp = require('gulp');
const babel = require('gulp-babel');
const env = require('gulp-util').env;
const gulpif = require('gulp-if');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
const data = require('gulp-data');
const del = require('del');
const merge = require('merge-stream');
const mkdirp = require('mkdirp');
const rename = require('gulp-rename');
const rjs = require('requirejs');
const runseq = require('run-sequence');
const template = require('gulp-template');
const zip = require('gulp-zip');
const webpack = require('webpack');
const cssnext = require('postcss-cssnext');
const packg = require('./package.json');

gulp.task('clean-lib', () => del('lib'));
gulp.task('clean-build', () => del('build'));
gulp.task('clean', ['clean-lib', 'clean-build']);

function createWebpackConfig(options) {
  return {
    context: path.join(__dirname, './src'),
    entry: ['./ExtPlug'],
    watch: !!options.watch,

    module: {
      loaders: [
        { test: /\.css$/, loader: 'css!postcss' },
        { test: /\.json$/, loader: 'json' },
        {
          test: /\.js$/,
          exclude: /node_modules/,
          loader: 'babel',
          query: {
            presets: 'extplug',
          },
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
      options.minify && new webpack.optimize.UglifyJsPlugin(),
    ].filter(Boolean),

    postcss() {
      return [cssnext()];
    },
  };
}

gulp.task('build:source', (done) => {
  webpack(createWebpackConfig({
    minify: !!env.minify,
  }), done);
});

gulp.task('build:loader:transform', () =>
  gulp.src('src/main.js')
    .pipe(babel({
      presets: [
        ['extplug', { amd: true }],
      ],
    }))
    .pipe(rename('init.js'))
    .pipe(gulp.dest('build'))
);

gulp.task('build:loader', ['build:loader:transform'], (done) => {
  rjs.optimize({
    baseUrl: './',
    name: 'extplug/loader',
    paths: {
      jquery: 'empty:',
      underscore: 'empty:',
      backbone: 'empty:',
      'extplug/loader': 'build/init',
      'plug-modules': 'node_modules/plug-modules/plug-modules',
    },
    optimize: 'none',
    out(text) {
      mkdirp('build', (e) => {
        if (e) {
          done(e);
        } else {
          fs.writeFile('build/loader.js', text, done);
        }
      });
    },
  });
});

gulp.task('concat', ['build:loader', 'build:source'], () =>
  gulp.src(['build/loader.js', 'build/source.js'])
    .pipe(concat('extplug.code.js'))
    .pipe(gulp.dest('build/'))
);

gulp.task('build', ['concat'], () =>
  gulp.src('src/loader.js.template')
    .pipe(data((file, cb) => {
      fs.readFile('build/extplug.code.js', 'utf8', (e, c) => {
        if (e) cb(e);
        else cb(null, { code: c });
      });
    }))
    .pipe(template())
    .pipe(gulpif(!!env.minify, uglify({
      compress: {
        screw_ie8: true,
        pure_getters: true,
        unsafe: true,
      },
      output: { screw_ie8: true },
      mangle: { toplevel: true },
    })))
    .pipe(rename('extplug.js'))
    .pipe(gulp.dest('build/'))
);

gulp.task('chrome-unpacked', () => merge(
  gulp.src(['extensions/chrome/main.js', 'extensions/chrome/manifest.json'])
    .pipe(template(packg))
    .pipe(gulp.dest('build/chrome/')),

  gulp.src(['img/icon*.png'])
    .pipe(gulp.dest('build/chrome/img/')),

  gulp.src(['build/extplug.js'])
    .pipe(concat('extplug.js'))
    .pipe(gulp.dest('build/chrome/'))
));

gulp.task('chrome-pack', () =>
  gulp.src('build/chrome/*')
    .pipe(zip('extplug.chrome.zip'))
    .pipe(gulp.dest('build/'))
);

gulp.task('chrome', (cb) => {
  runseq('chrome-unpacked', 'chrome-pack', cb);
});

gulp.task('firefox', () => merge(
  gulp.src(['extensions/firefox/*'])
    .pipe(template(packg))
    .pipe(gulp.dest('build/firefox/')),

  gulp.src(['build/extplug.js'])
    .pipe(gulp.dest('build/firefox/data/'))
));

gulp.task('userscript-meta', () =>
  gulp.src(['extensions/userscript/extplug.user.js'])
    .pipe(template(packg))
    .pipe(rename('extplug.meta.user.js'))
    .pipe(gulp.dest('build/'))
);

gulp.task('userscript', ['userscript-meta'], () =>
  gulp.src(['build/extplug.meta.user.js', 'build/extplug.js'])
    .pipe(concat('extplug.user.js'))
    .pipe(gulp.dest('build/'))
);

gulp.task('default', (cb) => {
  runseq(
    'clean-build',
    'build',
    ['chrome', 'firefox', 'userscript'],
    cb
  );
});
