/* eslint comma-dangle: ["error", "always-multiline"] */
const fs = require('fs');
const http = require('http');
const gulp = require('gulp');
const babel = require('gulp-babel');
const { colors, log } = require('gulp-util');
const through2 = require('through2');
const replace = require('replacestream');
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
const DevServer = require('webpack-dev-server');
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
          file.contents = Buffer.from(file.contents.toString().replace('CODE', () => code));
          cb(null, file);
        }
      });
    }))
    .pipe(rename('extplug.js'))
    .pipe(gulp.dest('build/'));
}

const build = gulp.series(
  gulp.parallel(buildSource, buildLoader),
  concatSource,
  wrapBuiltSourceInLoader
);

const buildWebExtensionFiles = gulp.parallel(
  () => gulp.src(['extensions/webextension/main.js', 'extensions/webextension/manifest.json'])
    .pipe(template(packg))
    .pipe(gulp.dest('build/webextension/')),

  () => gulp.src(['img/icon*.png'])
    .pipe(gulp.dest('build/webextension/img/')),

  () => gulp.src(['build/extplug.js'])
    .pipe(concat('extplug.js'))
    .pipe(gulp.dest('build/webextension/'))
);

function packWebExtension() {
  return gulp.src('build/webextension/*')
    .pipe(zip('extplug.extension.zip'))
    .pipe(gulp.dest('build/'));
}

const buildWebExtension = gulp.series(buildWebExtensionFiles, packWebExtension);

function userscriptMeta() {
  return gulp.src(['extensions/userscript/extplug.user.js'])
    .pipe(template(packg))
    .pipe(rename('extplug.meta.user.js'))
    .pipe(gulp.dest('build/'));
}

function userscriptConcat() {
  let inUserScriptComment = false;
  return gulp.src(['build/extplug.meta.user.js', 'build/extplug.js'])
    .pipe(gulpif(env === 'production', uglify({
      output: {
        comments(_, comment) {
          if (comment.value.includes('==UserScript==')) {
            inUserScriptComment = true;
          } else if (comment.value.includes('==/UserScript==')) {
            inUserScriptComment = false;
            return true;
          }
          return inUserScriptComment;
        },
      },
      compress: {
        pure_getters: true,
        unsafe: true,
      },
      toplevel: true,
    })))
    .pipe(concat('extplug.user.js'))
    .pipe(gulp.dest('build/'));
}

const buildUserscript = gulp.series(
  userscriptMeta,
  userscriptConcat
);

const buildExtensions = gulp.parallel(
  buildWebExtension,
  buildUserscript
);

function getPort() {
  const server = http.createServer().listen();
  const { port } = server.address();
  server.close();
  return port;
}

function dev(done) {
  const port = getPort();
  const publicPath = `https://localhost:${port}/`;
  const address = `${publicPath}dev.js`;

  webpackConfig.entry.unshift(
    `${require.resolve('webpack-dev-server/client')}?${publicPath}`,
    'webpack/hot/dev-server'
  );
  webpackConfig.entry.pop();
  webpackConfig.entry.push('./hotReloader.js');
  webpackConfig.output.publicPath = publicPath;
  webpackConfig.output.filename = 'dev.js';
  webpackConfig.plugins.push(new webpack.HotModuleReplacementPlugin());
  const compiler = webpack(webpackConfig);
  const server = new DevServer(compiler, {
    port,
    publicPath,
    contentBase: webpackConfig.output.path,
    hot: true,
    https: true,
    disableHostCheck: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    setup(app) {
      app.get('/ok.html', (req, res) => {
        res.setHeader('content-type', 'text/html');
        fs.createReadStream('src/devCertificateHelper.html').pipe(res);
      });
    },
  });

  server.listen(port, () => {
    function writeDevStub() {
      return fs.createReadStream('src/devStub.js')
        .pipe(replace('PUBLIC_PATH', JSON.stringify(publicPath)))
        .pipe(replace('ADDRESS', JSON.stringify(address)))
        .pipe(fs.createWriteStream('build/source.js'));
    }
    gulp.series(
      gulp.parallel(buildLoader, writeDevStub),
      concatSource,
      wrapBuiltSourceInLoader,
      buildExtensions
    )(done);
  });
}

exports.default = gulp.series(
  cleanBuild,
  build,
  buildExtensions
);

exports.clean = clean;
exports.loader = buildLoader;
exports.build = build;
exports.dev = dev;
exports.userscript = buildUserscript;
exports.watchWebExtension = () =>
  gulp.watch('src/**/*', gulp.series(build, buildWebExtension));
exports.watchUserscript = () =>
  gulp.watch('src/**/*', gulp.series(build, buildUserscript));
exports.watch = () =>
  gulp.watch('src/**/*', gulp.series(build, buildExtensions));
