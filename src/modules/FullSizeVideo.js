(extp = window.extp || []).push(function (ext) {

  ext.define('FullSizeVideo', function (require, exports, module) {
    var Module = require('extplug/Module'),
      fnUtils = require('extplug/util/function'),
      win = require('plug/util/window');

    module.exports = Module({
      name: 'Full-Size Video',

      settings: {
        showDj: {
          type: Boolean,
          label: 'Show DJ Button',
          default: true
        },
        showVote: {
          type: Boolean,
          label: 'Show Vote Panel',
          default: true
        }
      },

      init: function () {
        fnUtils.bound(this, 'update');
      },

      enable: function () {
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
          '#avatars-container': { display: 'none !important' },
          'body.extplug-fsv-nodj #dj-button, body.extplug-fsv-novote #vote': { display: 'none !important' }
        });
        this.settings.on('change:showDj change:showVote', this.update);
        this.update();
        setTimeout(function () {
          win.onResize();
        }, 1);
      },

      disable: function () {
        this.$('body').removeClass('extplug-fsv-nodj extplug-fsv-novote');
        this.settings.off('change:showDj change:showVote', this.update);
        setTimeout(function () {
          win.onResize();
        }, 1);
      },

      update: function () {
        var body = this.$('body');
        if (this.settings.get('showDj')) {
          body.removeClass('extplug-fsv-nodj');
        } else {
          body.addClass('extplug-fsv-nodj');
        }
        if (this.settings.get('showVote')) {
          body.removeClass('extplug-fsv-novote');
        } else {
          body.addClass('extplug-fsv-novote');
        }
      }

    });

  });

});