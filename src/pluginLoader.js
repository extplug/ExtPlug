define(function (require, exports, module) {

  const request = require('./util/request');
  const PluginMeta = require('./models/PluginMeta');

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

  exports.load = function (url, cb) {
    let o = parse(url);
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
    let pluginId = o.name || o.url;
    let onLoad = Plugin => {
      let instance = new Plugin(pluginId, window.extp);
      let meta = new PluginMeta({
        id: pluginId,
        fullUrl: url,
        name: instance.name,
        description: instance.description,
        instance: instance,
        class: Plugin
      });
      cb(null, meta);
    };
    requirejs([ pluginId ], onLoad, cb);
  };

});
