define('extplug/plugins/autowoot/main', function (require, exports, module) {

  var Plugin = require('extplug/Plugin'),
    fnUtils = require('extplug/util/function');

  module.exports = Plugin.extend({
    name: 'Autowoot',

    init: function (id, ext) {
      this._super(id, ext);
      fnUtils.bound(this, 'onAdvance');
      fnUtils.bound(this, 'woot');
    },

    enable: function () {
      this._super();
      this.wootElement = this.$('#woot');
      this.woot();
      API.on(API.ADVANCE, this.onAdvance);
    },

    disable: function () {
      this._super();
      API.off(API.ADVANCE, this.onAdvance);
    },

    woot: function () {
      this.wootElement.click();
    },

    onAdvance: function () {
      setTimeout(this.woot, 3000 + Math.floor(Math.random() * 5000));
    }

  });

});
