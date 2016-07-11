import babel from 'gulp-babel';
import babelHelpers from 'gulp-babel-external-helpers';
import browserify from 'browserify';
import concat from 'gulp-concat';
import data from 'gulp-data';
import del from 'del';
import fs from 'fs';
import gulp from 'gulp';
import merge from 'merge-stream';
import mkdirp from 'mkdirp';
import rename from 'gulp-rename';
import rjs from 'requirejs';
import runseq from 'run-sequence';
import source from 'vinyl-source-stream';
import template from 'gulp-template';
import zip from 'gulp-zip';
import packg from './package.json';

gulp.task('clean-lib', cb => {
  del('lib', cb);
});

gulp.task('clean-build', cb => {
  del('build', cb);
});

gulp.task('clean', ['clean-lib', 'clean-build']);

gulp.task('babel', () =>
  gulp.src('src/**/*.js')
    .pipe(babel({
      presets: ['extplug'],
      plugins: ['external-helpers'],
    }))
    .pipe(babelHelpers('_babelHelpers.js', 'var'))
    .pipe(gulp.dest('lib/'))
);

const nodelib = (entry, standalone, name = `${standalone}.js`) => {
  const opts = {
    entries: `./node_modules/${entry}`,
  };
  if (standalone) {
    opts.standalone = standalone;
  }

  return () => browserify(opts)
    .bundle()
    .pipe(source(name))
    .pipe(gulp.dest('build/_deps/'));
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
  'lib-regexp-quote',
]);

gulp.task('rjs', done => {
  const npm = 'node_modules/';
  packg.builtAt = Date.now();
  const packgString = JSON.stringify(packg, null, 2);
  delete packg.builtAt;
  rjs.optimize({
    baseUrl: './',
    name: 'extplug/main',
    include: ['extplug/ExtPlug'],
    paths: {
      // plug-modules defines, these are defined at runtime
      // so the r.js optimizer can't find them
      plug: 'empty:',
      lang: 'empty:',
      backbone: 'empty:',
      jquery: 'empty:',
      underscore: 'empty:',
      meld: `${npm}meld/meld`,
      sistyl: 'build/_deps/sistyl',
      extplug: 'lib',
      'plug-modules': `${npm}plug-modules/plug-modules`,
      debug: 'build/_deps/debug',
      onecolor: `${npm}onecolor/one-color-all`,
      'regexp-quote': 'build/_deps/regexp-quote',
      'semver-compare': 'build/_deps/semvercmp',
    },
    rawText: {
      'package.json': `define(${packgString})`,
      'extplug/package': `define(${packgString})`,
    },
    insertRequire: ['extplug/main'],
    optimize: 'none',
    out(text) {
      mkdirp('build', e => {
        if (e) {
          done(e);
        } else {
          fs.writeFile('build/build.rjs.js', text, done);
        }
      });
    },
  });
});

gulp.task('concat', () =>
  gulp.src(['build/_deps/es6-symbol.js', 'lib/_babelHelpers.js', 'build/build.rjs.js'])
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

gulp.task('chrome', cb => {
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

gulp.task('default', cb => {
  runseq(
    'clean',
    ['babel', 'dependencies'],
    'rjs',
    'build',
    ['chrome', 'firefox', 'userscript'],
    cb
  );
});
