var gulp   = require('gulp')
var babel  = require('gulp-babel')
var concat = require('gulp-concat')
var del    = require('del')
var rename = require('gulp-rename')
var templ  = require('gulp-template')
var runseq = require('run-sequence')
var rjs    = require('requirejs')
var mkdirp = require('mkdirp')
var fs     = require('fs')
var packg  = require('./package.json')

gulp.task('babel', [ 'clean-lib' ], function () {
  return gulp.src('src/**/*')
    .pipe(babel({ modules: 'ignore' }))
    .pipe(gulp.dest('lib/'))
})

gulp.task('clean-lib', function (cb) {
  del('lib', cb)
})

gulp.task('rjs', [ 'babel' ], function (done) {
  var npm = '../node_modules/'
  packg.builtAt = Date.now()
  var packgString = JSON.stringify(packg, null, 2)
  delete packg.builtAt
  rjs.optimize({
    baseUrl: 'lib/',
    name: 'extplug/boot',
    include: [
      'extplug/ExtPlug',
      'extplug/Module'
    ],
    paths: {
      // plug-modules defines, these are defined at runtime
      // so the r.js optimizer can't find them
      plug: 'empty:',
      backbone: 'empty:',
      jquery: 'empty:',
      underscore: 'empty:',
      meld: npm + 'meld/meld',
      sistyl: npm + 'sistyl/lib/sistyl',
      'plug-modules': npm + 'plug-modules/plug-modules'
    },
    rawText: {
      'extplug/package': 'define(' + packgString + ')'
    },
    optimize: 'none',
    out: function (text) {
      mkdirp('build', function (e) {
        if (e) done (e)
        else   fs.writeFile('build/build.rjs.js', text, done)
      })
    }
  })
})

gulp.task('build', [ 'rjs' ], function () {
  return gulp.src([ 'build/build.rjs.js'
                  , 'lib/plugins/*'
                  , 'lib/extplug/plugdj.user.js' ])
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

gulp.task('default', function () {
  return runseq(
    'clean-build',
    'build',
    [ 'chrome', 'userscript' ]
  )
})
