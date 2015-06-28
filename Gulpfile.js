var babel = require('gulp-babel');
var babelHelpers = require('gulp-babel-external-helpers');
var browserify = require('browserify');
var concat = require('gulp-concat');
var data = require('gulp-data');
var del = require('del');
var fs = require('fs');
var gulp = require('gulp');
var merge = require('merge-stream');
var mkdirp = require('mkdirp');
var packg  = require('./package.json');
var rename = require('gulp-rename');
var rjs = require('requirejs');
var runseq = require('run-sequence');
var source = require('vinyl-source-stream');
var template = require('gulp-template');
var zip = require('gulp-zip');

gulp.task('babel', function () {
  return gulp.src('src/**/*.js')
    .pipe(babel({ modules: 'ignore', externalHelpers: true }))
    .pipe(babelHelpers('_babelHelpers.js', 'var'))
    .pipe(gulp.dest('lib/'));
});

gulp.task('clean-lib', function (cb) {
  del('lib', cb);
});

var nodelib = function (entry, standalone, name) {
  name = name || standalone + '.js';

  var opts = {
    entries: './node_modules/' + entry
  };
  if (standalone) opts.standalone = standalone;

  return function () {
    return browserify(opts)
      .bundle()
      .pipe(source(name))
      .pipe(gulp.dest('build/_deps/'));
  };
};

gulp.task('lib-debug', nodelib('debug/browser.js', 'debug'));
gulp.task('lib-semvercmp', nodelib('semver-compare/index.js', 'semvercmp'));
gulp.task('lib-symbol', nodelib('es6-symbol/implement.js', false, 'es6-symbol.js'));
gulp.task('lib-regexp-quote', nodelib('regexp-quote/regexp-quote.js', 'regexp-quote'));
gulp.task('lib-sistyl', nodelib('sistyl/lib/sistyl.js', 'sistyl'));

gulp.task('dependencies', [
  'lib-debug',
  'lib-semvercmp',
  'lib-sistyl',
  'lib-symbol',
  'lib-regexp-quote'
]);

gulp.task('rjs', function (done) {
  var npm = 'node_modules/';
  packg.builtAt = Date.now();
  var packgString = JSON.stringify(packg, null, 2);
  delete packg.builtAt;
  rjs.optimize({
    baseUrl: './',
    name: 'extplug/main',
    include: [ 'extplug/ExtPlug' ],
    paths: {
      // plug-modules defines, these are defined at runtime
      // so the r.js optimizer can't find them
      plug: 'empty:',
      lang: 'empty:',
      backbone: 'empty:',
      jquery: 'empty:',
      underscore: 'empty:',
      meld: npm + 'meld/meld',
      sistyl: 'build/_deps/sistyl',
      extplug: 'lib',
      'plug-modules': npm + 'plug-modules/plug-modules',
      'debug': 'build/_deps/debug',
      'onecolor': npm + 'onecolor/one-color-all',
      'regexp-quote': 'build/_deps/regexp-quote',
      'semver-compare': 'build/_deps/semvercmp'
    },
    rawText: {
      'extplug/package': 'define(' + packgString + ')'
    },
    insertRequire: [ 'extplug/main' ],
    optimize: 'none',
    out: function (text) {
      mkdirp('build', function (e) {
        if (e) {
          done(e);
        }
        else {
          fs.writeFile('build/build.rjs.js', text, done);
        }
      });
    }
  });
});

gulp.task('concat', function () {
  return gulp.src([ 'build/_deps/es6-symbol.js'
                  , 'lib/_babelHelpers.js'
                  , 'build/build.rjs.js' ])
    .pipe(concat('extplug.code.js'))
    .pipe(gulp.dest('build/'));
});

gulp.task('build', [ 'concat' ], function () {
  return gulp.src('src/loader.js.template')
    .pipe(data(function (file, cb) {
      fs.readFile('build/extplug.code.js', 'utf8', function (e, c) {
        if (e) cb(e);
        else cb(null, { code: c });
      });
    }))
    .pipe(template())
    .pipe(rename('extplug.js'))
    .pipe(gulp.dest('build/'));
});

gulp.task('clean-build', function (cb) {
  del('build', cb);
});

gulp.task('chrome-unpacked', function (cb) {
  return merge(
    gulp.src([ 'extensions/chrome/main.js', 'extensions/chrome/manifest.json' ])
      .pipe(template(packg))
      .pipe(gulp.dest('build/chrome/')),

    gulp.src([ 'build/extplug.js' ])
      .pipe(concat('extplug.js'))
      .pipe(gulp.dest('build/chrome/'))
  );
});

gulp.task('chrome-pack', function () {
  return gulp.src('build/chrome/*')
    .pipe(zip('extplug.chrome.zip'))
    .pipe(gulp.dest('build/'));
});

gulp.task('chrome', function (cb) {
  runseq('chrome-unpacked', 'chrome-pack', cb);
});

gulp.task('firefox', function () {
  return merge(
    gulp.src([ 'extensions/firefox/*' ])
      .pipe(template(packg))
      .pipe(gulp.dest('build/firefox/')),

    gulp.src([ 'build/extplug.js' ])
      .pipe(gulp.dest('build/firefox/data/'))
  );
});

gulp.task('userscript-meta', function () {
  return gulp.src([ 'extensions/userscript/extplug.user.js' ])
    .pipe(template(packg))
    .pipe(rename('extplug.meta.user.js'))
    .pipe(gulp.dest('build/'));
});

gulp.task('userscript', [ 'userscript-meta' ], function () {
  return gulp.src([ 'build/extplug.meta.user.js', 'build/extplug.js' ])
    .pipe(concat('extplug.user.js'))
    .pipe(gulp.dest('build/'));
});

gulp.task('clean', [ 'clean-lib', 'clean-build' ]);

gulp.task('default', function (cb) {
  runseq(
    'clean',
    [ 'babel', 'dependencies' ],
    'rjs',
    'build',
    [ 'chrome', 'firefox', 'userscript' ],
    cb
  );
});
