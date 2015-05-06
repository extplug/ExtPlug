define(function (require, exports, module) {

  const { Collection } = require('backbone');
  const PluginMeta = require('extplug/models/PluginMeta');

  const PluginsCollection = Collection.extend({
    model: PluginMeta,
    comparator(a, b) {
      return a.get('name') > b.get('name') ? 1
           : a.get('name') < b.get('name') ? -1
           : 0
    }
  });

  module.exports = PluginsCollection;

});