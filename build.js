var fs = require('fs')

fs.readFile('src/plugdj.user.js', { encoding: 'utf8' }, function (e, c) {
  c = c.replace(/\/\/\= (.*?)\n/g, function (_, n) {
    console.log('linking', n)
    return fs.readFileSync('src/' + n + '.js', { encoding: 'utf8' }) + ';'
  })

  fs.writeFile('build/plugdj.user.js', c, function () {
    console.log('done')
  })
})