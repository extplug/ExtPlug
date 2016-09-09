import * as path from 'path';
import * as fs from 'fs';
import gulp from 'gulp';
import babel from 'gulp-babel';
import babelHelpers from 'gulp-babel-external-helpers';
import concat from 'gulp-concat';
import data from 'gulp-data';
import del from 'del';
import merge from 'merge-stream';
import mkdirp from 'mkdirp';
import rename from 'gulp-rename';
import rjs from 'requirejs';
import runseq from 'run-sequence';
import template from 'gulp-template';
import zip from 'gulp-zip';
import webpack from 'webpack';
import packg from './package.json';

gulp.task('clean-lib', () => del('lib'));
gulp.task('clean-build', () => del('build'));

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

function createWebpackConfig(options) {
  return {
    context: path.join(__dirname, './src'),
    entry: ['./ExtPlug'],
    watch: !!options.watch,

    module: {
      loaders: [
        { test: /\.json$/, loader: 'json' },
        {
          test: /\.js$/,
          exclude: /node_modules/,
          loader: 'babel',
          query: {
            presets: 'extplug',
            plugins: 'external-helpers',
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
  };
}

gulp.task('build:source', done => {
  webpack(createWebpackConfig({}), done);
});

gulp.task('build:loader', ['babel'], done => {
  rjs.optimize({
    baseUrl: './',
    name: 'extplug/loader',
    paths: {
      jquery: 'empty:',
      underscore: 'empty:',
      backbone: 'empty:',
      plug: 'empty:',
      'extplug/loader': 'lib/main',
      'plug-modules': 'node_modules/plug-modules/plug-modules',
    },
    optimize: 'none',
    out(text) {
      mkdirp('build', e => {
        if (e) {
          done(e);
        } else {
          fs.writeFile('build/loader.js', text, done);
        }
      });
    },
  });
});

gulp.task('concat', ['babel', 'build:loader', 'build:source'], () =>
  gulp.src(['lib/_babelHelpers.js', 'build/loader.js', 'build/source.js'])
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
    'clean-build',
    'build',
    ['chrome', 'firefox', 'userscript'],
    cb
  );
});
