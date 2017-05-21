/* eslint comma-dangle: ["error", "always-multiline"] */
const fs = require('fs');
const gulp = require('gulp');
const babel = require('gulp-babel');
const colors = require('gulp-util').colors;
const log = require('gulp-util').log;
const through2 = require('through2');
const gulpif = require('gulp-if');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
const del = require('del');
const mkdirp = require('mkdirp');
const rename = require('gulp-rename');
const rjs = require('requirejs');
const template = require('gulp-template');
const zip = require('gulp-zip');
const webpack = require('webpack');
const webpackConfig = require('./webpack.config');
const packg = require('./package.json');

const env = process.env.NODE_ENV || 'development';

function cleanLib() {
  return del('lib');
}
function cleanBuild() {
  return del('build');
}
const clean = gulp.parallel(
  cleanLib,
  cleanBuild
);

function buildSource(done) {
  webpack(webpackConfig, (err, stats) => {
    if (err) {
      done(err);
    } else {
      stats.toString({
        modules: false,
        colors: colors.enabled,
      }).split('\n').forEach((line) => {
        log(line);
      });
      done();
    }
  });
}

function buildLoaderTransform() {
  return gulp.src('src/main.js')
    .pipe(babel({
      presets: [
        ['extplug', { modules: 'amd' }],
      ],
    }))
    .pipe(rename('init.js'))
    .pipe(gulp.dest('build'));
}

function buildLoaderBundle(done) {
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
}

const buildLoader = gulp.series(buildLoaderTransform, buildLoaderBundle);

function concatSource() {
  return gulp.src(['build/loader.js', 'build/source.js'])
    .pipe(concat('extplug.code.js'))
    .pipe(gulp.dest('build/'));
}

function wrapBuiltSourceInLoader() {
  return gulp.src('src/loader.template.js', { buffer: true })
    .pipe(through2.obj((file, enc, cb) => {
      fs.readFile('build/extplug.code.js', 'utf8', (e, code) => {
        if (e) {
          cb(e);
        } else {
          file.contents = new Buffer(file.contents.toString().replace('CODE', () => code));
          cb(null, file);
        }
      });
    }))
    .pipe(gulpif(env === 'production', uglify({
      compress: {
        pure_getters: true,
        unsafe: true,
      },
      toplevel: true,
    })))
    .pipe(rename('extplug.js'))
    .pipe(gulp.dest('build/'));
}

const build = gulp.series(
  gulp.parallel(buildSource, buildLoader),
  concatSource,
  wrapBuiltSourceInLoader
);

const buildChromeExtensionFiles = gulp.parallel(
  () => gulp.src(['extensions/chrome/main.js', 'extensions/chrome/manifest.json'])
    .pipe(template(packg))
    .pipe(gulp.dest('build/chrome/')),

  () => gulp.src(['img/icon*.png'])
    .pipe(gulp.dest('build/chrome/img/')),

  () => gulp.src(['build/extplug.js'])
    .pipe(concat('extplug.js'))
    .pipe(gulp.dest('build/chrome/'))
);

function packChromeExtension() {
  return gulp.src('build/chrome/*')
    .pipe(zip('extplug.chrome.zip'))
    .pipe(gulp.dest('build/'));
}

const buildChromeExtension = gulp.series(buildChromeExtensionFiles, packChromeExtension);

const buildFirefoxExtension = gulp.parallel(
  () => gulp.src(['extensions/firefox/*'])
    .pipe(template(packg))
    .pipe(gulp.dest('build/firefox/')),

  () => gulp.src(['build/extplug.js'])
    .pipe(gulp.dest('build/firefox/data/'))
);

function userscriptMeta() {
  return gulp.src(['extensions/userscript/extplug.user.js'])
    .pipe(template(packg))
    .pipe(rename('extplug.meta.user.js'))
    .pipe(gulp.dest('build/'));
}

function userscriptConcat() {
  return gulp.src(['build/extplug.meta.user.js', 'build/extplug.js'])
    .pipe(concat('extplug.user.js'))
    .pipe(gulp.dest('build/'));
}

const buildUserscript = gulp.series(
  userscriptMeta,
  userscriptConcat
);

const buildExtensions = gulp.parallel(
  buildChromeExtension,
  buildFirefoxExtension,
  buildUserscript
);

exports.default = gulp.series(
  cleanBuild,
  build,
  buildExtensions
);

exports.clean = clean;
exports.loader = buildLoader;
exports.build = build;
exports.userscript = buildUserscript;
exports.watchChrome = () =>
  gulp.watch('src/**/*', gulp.series(build, buildChromeExtension));
exports.watchFirefox = () =>
  gulp.watch('src/**/*', gulp.series(build, buildFirefoxExtension));
exports.watchUserscript = () =>
  gulp.watch('src/**/*', gulp.series(build, buildUserscript));
exports.watch = () =>
  gulp.watch('src/**/*', gulp.series(build, buildExtensions));
