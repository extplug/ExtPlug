define(function (require, exports, module) {

  const Backbone = require('backbone');

  const Settings = Backbone.Model.extend({

    initialize(attrs, opts = {}) {
      this._meta = opts.meta;
    },

    meta() {
      return this._meta;
    }

  });

  module.exports = Settings;

});
