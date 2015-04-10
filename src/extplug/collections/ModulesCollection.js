define(function (require, exports, module) {

  var Backbone = require('backbone'),
    Module = require('extplug/models/Module');

  var ModulesCollection = Backbone.Collection.extend({
    model: Module,
    comparator: function (a, b) {
      return a.get('name') > b.get('name') ? 1
           : a.get('name') < b.get('name') ? -1
           : 0
    }
  });

  module.exports = ModulesCollection;

});