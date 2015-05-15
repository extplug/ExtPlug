var gulp   = require('gulp')
var babel  = require('gulp-babel')
var concat = require('gulp-concat')
var rjs    = require('requirejs')
var fs     = require('fs')
var packg  = require('./package.json')

gulp.task('babel', function () {
  return gulp.src('src/**/*')
    .pipe(babel({ modules: 'ignore' }))
    .pipe(gulp.dest('lib/'))
})

gulp.task('rjs', [ 'babel' ], function (done) {
  var bower = '../bower_components/'
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
      meld: bower + 'meld/meld',
      sistyl: bower + 'sistyl/lib/sistyl',
      'plug-modules': npm + 'plug-modules/plug-modules'
    },
    rawText: {
      'extplug/package': 'define(' + packgString + ')'
    },
    optimize: 'none',
    out: function (text) {
      fs.writeFile('build/build.rjs.js', text, done)
    }
  })
})

gulp.task('build', [ 'rjs' ], function () {
  return gulp.src([ 'build/build.rjs.js'
                  , 'lib/plugins/*'
                  , 'lib/extplug/plugdj.user.js' ])
    .pipe(concat('build.full.js'))
    .pipe(gulp.dest('build/'))
})
