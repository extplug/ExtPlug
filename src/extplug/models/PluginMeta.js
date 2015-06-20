define(function (require, exports, module) {

  const { Model } = require('backbone');

  const PluginMeta = Model.extend({

    defaults: {
      enabled: false,
      name: '',
      instance: null
    },

    initialize() {
      this.get('instance')
        .on('enable',  () => { this.set('enabled', true);  })
        .on('disable', () => { this.set('enabled', false); });
    },

    enable() {
      if (!this.get('enabled')) {
        this.get('instance').enable();
      }
    },

    disable() {
      if (this.get('enabled')) {
        this.get('instance').disable();
      }
    }

  });

  module.exports = PluginMeta;

});
