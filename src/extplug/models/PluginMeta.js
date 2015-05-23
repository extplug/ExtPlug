define(function (require, exports, module) {

  const { Model } = require('backbone');

  const PluginMeta = Model.extend({

    defaults: {
      enabled: false,
      name: '',
      instance: null
    },

    enable() {
      if (!this.get('enabled')) {
        this.set('enabled', true);
        this.get('instance').enable();
      }
    },

    disable() {
      if (this.get('enabled')) {
        this.set('enabled', false);
        this.get('instance').disable();
      }
    }

  });

  module.exports = PluginMeta;

});
