define('extplug/modules/full-size-video/main', function (require, exports, module) {
  var Module = require('extplug/Module'),
    fnUtils = require('extplug/util/function'),
    win = require('plug/util/window');

  module.exports = Module.extend({
    name: 'Full-Size Video',

    init: function (id, ext) {
      this._super(id, ext);
      fnUtils.bound(this, 'enter');
      fnUtils.bound(this, 'leave');
    },

    enable: function () {
      this._super();
      this.Style({
        '#playback': {
          left: '0px !important',
          right: '343px !important',
          width: 'auto !important',
          bottom: '54px !important',
          height: 'auto !important'
        },
        '#playback .background img': { display: 'none' },
        '#playback-controls': {
          left: '25% !important',
          width: '50% !important'
        },
        '#playback-container': {
          top: '0px !important',
          left: '0px !important',
          right: '0px !important',
          width: 'auto !important',
          bottom: '0px !important',
          height: 'auto !important',
          background: '#000'
        },
        '#avatars-container': { display: 'none !important' }
      });
      setTimeout(function () {
        win.onResize();
      }, 1);

      this.$('#playback').on('mouseenter', this.enter).on('mouseleave', this.leave);
      this.leave();
    },

    enter: function () {
      this.$('#dj-button, #vote').show();
    },
    leave: function (e) {
      // don't hide if the new target is one of the buttons
      if (e && e.relatedTarget && $(e.relatedTarget).closest('#dj-button, #vote').length > 0) {
        return;
      }
      this.$('#dj-button, #vote').hide();
    },

    disable: function () {
      this._super();
      this.enter();
      this.$('#playback').off('mouseenter', this.enter).off('mouseleave', this.leave);
      setTimeout(function () {
        win.onResize();
      }, 1);
    }

  });

});

(extp = window.extp || []).push('extplug/modules/full-size-video/main');
