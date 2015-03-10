(extp = window.extp || []).push(function (ext) {

  ext.define('Autowoot', function (require, exports, module) {

    var Module = require('extplug/Module'),
      fnUtils = require('extplug/util/function');

    module.exports = Module({
      name: 'Autowoot',

      init: function () {
        fnUtils.bound(this, 'onAdvance');
      },

      enable: function () {
        this.wootElement = this.$('#woot');
        this.woot();
        API.on(API.ADVANCE, this.onAdvance);
      },

      disable: function () {
        API.off(API.ADVANCE, this.onAdvance);
      },

      woot: function () {
        this.wootElement.click();
      },

      onAdvance: function () {
        setTimeout(this.woot.bind(this), 3000 + Math.floor(Math.random() * 5000));
      }

    });

  });

});