define('extplug/models/Module', function (require, exports, module) {

  var Backbone = require('backbone');

  return Backbone.Model.extend({

    defaults: {
      enabled: false,
      name: '',
      module: null
    },

    enable: function () {
      if (!this.get('enabled')) {
        this.set('enabled', true);
        this.get('module').enable();
      }
    },

    disable: function () {
      if (this.get('enabled')) {
        this.set('enabled', false);
        this.get('module').disable();
      }
    }

  });

});