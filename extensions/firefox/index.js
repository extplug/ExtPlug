var pageMod = require('sdk/page-mod');
var self = require('sdk/self');

function inject(url) {
  var s = document.createElement('script');
  s.src = url;
  s.id = 'extplug-extsrc';
  s.async = true;
  document.body.appendChild(s);
}

pageMod.PageMod({
  include: 'https://plug.dj/*',
  attachTo: 'top',
  contentScript: ';(' + inject + '(' + JSON.stringify(self.data.url('extplug.js')) + '));'
});
