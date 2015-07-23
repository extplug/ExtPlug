var browserify = require('browserify')
var gulp   = require('gulp')
var babel  = require('gulp-babel')
var concat = require('gulp-concat')
var del    = require('del')
var rename = require('gulp-rename')
var templ  = require('gulp-template')
var runseq = require('run-sequence')
var rjs    = require('requirejs')
var mkdirp = require('mkdirp')
var source = require('vinyl-source-stream')
var fs     = require('fs')
var packg  = require('./package.json')

gulp.task('babel', function () {
  return gulp.src('src/**/*')
    .pipe(babel({ only: '**/*.js', modules: 'ignore' }))
    .pipe(gulp.dest('lib/'))
})

gulp.task('clean-lib', function (cb) {
  del('lib', cb)
})

var nodelib = function (entry, standalone, name) {
  name = name || standalone + '.js'

  var opts = {
    entries: './node_modules/' + entry
  }
  if (standalone) opts.standalone = standalone

  return function () {
    return browserify(opts)
      .bundle()
      .pipe(source(name))
      .pipe(gulp.dest('build/_deps/'))
  }
}

gulp.task('lib-debug', nodelib('debug/browser.js', 'debug'))
gulp.task('lib-semvercmp', nodelib('semver-compare/index.js', 'semvercmp'))
gulp.task('lib-symbol', nodelib('es6-symbol/implement.js', false, 'es6-symbol.js'))
gulp.task('lib-regexp-quote', nodelib('regexp-quote/regexp-quote.js', 'regexp-quote'))

gulp.task('dependencies', [ 'lib-debug'
                          , 'lib-semvercmp'
                          , 'lib-symbol'
                          , 'lib-regexp-quote' ])

gulp.task('rjs', function (done) {
  var npm = 'node_modules/'
  packg.builtAt = Date.now()
  var packgString = JSON.stringify(packg, null, 2)
  delete packg.builtAt
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
      sistyl: npm + 'sistyl/lib/sistyl',
      extplug: 'lib',
      'plug-modules': npm + 'plug-modules/plug-modules',
      'debug': 'build/_deps/debug',
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
        if (e) done (e)
        else   fs.writeFile('build/build.rjs.js', text, done)
      })
    }
  })
})

gulp.task('build', function () {
  return gulp.src([ 'build/_deps/es6-symbol.js'
                  , 'build/build.rjs.js' ])
    .pipe(concat('extplug.js'))
    .pipe(gulp.dest('build/'))
})

gulp.task('clean-build', function (cb) {
  del('build', cb)
})

gulp.task('chrome', function () {
  gulp.src([ 'extensions/chrome/main.js', 'extensions/chrome/manifest.json' ])
    .pipe(templ(packg))
    .pipe(gulp.dest('build/chrome/'))

  gulp.src([ 'build/extplug.js' ])
    .pipe(concat('extplug.js'))
    .pipe(gulp.dest('build/chrome/'))
})

gulp.task('userscript-meta', function () {
  return gulp.src([ 'extensions/userscript/extplug.user.js' ])
    .pipe(templ(packg))
    .pipe(rename('extplug.meta.user.js'))
    .pipe(gulp.dest('build/'))
})

gulp.task('userscript', [ 'userscript-meta' ], function () {
  return gulp.src([ 'build/extplug.meta.user.js', 'build/extplug.js' ])
    .pipe(concat('extplug.user.js'))
    .pipe(gulp.dest('build/'))
})

gulp.task('clean', [ 'clean-lib', 'clean-build' ])

gulp.task('default', function (cb) {
  runseq(
    'clean',
    [ 'babel', 'dependencies' ],
    'rjs',
    'build',
    [ 'chrome', 'userscript' ],
    cb
  )
})
