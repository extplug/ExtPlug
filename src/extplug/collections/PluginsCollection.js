define(function (require, exports, module) {

  var Backbone = require('backbone'),
    PluginMeta = require('extplug/models/PluginMeta');

  var PluginsCollection = Backbone.Collection.extend({
    model: PluginMeta,
    comparator: function (a, b) {
      return a.get('name') > b.get('name') ? 1
           : a.get('name') < b.get('name') ? -1
           : 0
    }
  });

  module.exports = PluginsCollection;

});