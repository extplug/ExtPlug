define(function (require, exports, module) {

  const request = require('extplug/util/request');

  function parse(name) {
    let parts = name.split(';');
    let o = {};
    o.url = parts[0];
    if (parts[1]) {
      o.name = parts[1];
    }

    // force https
    o.url = o.url.replace(/^http:/, 'https:');

    return o;
  }

  exports.load = function (name, req, cb, config) {
    let o = parse(name);
    if (o.name) {
      // add module name alias to the plugin URL
      // this way, when we require([ module name ]), the plugin URL
      // will be loaded instead.
      // then, the plugin URL will define() the module name anyway,
      // and requirejs will figure everything out.
      // Chopping off the .js extension because require.js adds it
      // since we're actually requiring a module name and not a path.
      requirejs({ paths: { [o.name]: o.url.replace(/\.js$/, '') } });
    }
    requirejs([ o.name || o.url ], cb);
  };

});
