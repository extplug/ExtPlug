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
        this.ext.woot();
        this.ext.on('advance', this.onAdvance);
      },

      disable: function () {
        this.ext.off('advance', this.onAdvance);
      },

      onAdvance: function () {
        setTimeout(this.ext.woot.bind(this.ext), 3000 + Math.floor(Math.random() * 5000));
      }

    });

  });

});