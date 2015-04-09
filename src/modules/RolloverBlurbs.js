define('extplug/modules/rollover-blurbs/main', function (require, exports, module) {

  var Module = require('extplug/Module'),
    fnUtils = require('extplug/util/function'),
    rolloverView = require('plug/views/users/userRolloverView'),
    UserFindAction = require('plug/actions/users/UserFindAction'),
    $ = require('jquery');

  var emoji = $('<span />').addClass('emoji-glow')
    .append($('<span />').addClass('emoji emoji-1f4dd'));

  module.exports = Module.extend({
    name: 'Rollover Blurb (Experimental)',
    description: 'Show user "Blurb" / bio in rollover popups.',

    enable: function () {
      this._super();
      this.Style({
        '.extplug-blurb': {
          padding: '10px',
          position: 'absolute',
          top: '3px',
          background: '#282c35',
          width: '100%',
          'box-sizing': 'border-box',
          display: 'none'
        },
        '.expand .extplug-blurb': {
          display: 'block'
        }
      });

      fnUtils.replaceMethod(rolloverView, 'showModal', this.addBlurb);
      fnUtils.replaceMethod(rolloverView, 'hide', this.removeBlurb);
    },

    disable: function () {
      this._super();
      fnUtils.unreplaceMethod(rolloverView, 'showModal', this.addBlurb);
      fnUtils.unreplaceMethod(rolloverView, 'hide', this.removeBlurb);
    },

    addBlurb: function (showModal, _arg) {
      var self = this;
      this.$('.extplug-blurb-wrap').remove();
      var span = $('<span />').addClass('extplug-blurb');
      var div = $('<div />').addClass('info extplug-blurb-wrap').append(span);
      if (this.user.get('blurb')) {
        show(this.user.get('blurb'));
      }
      else {
        new UserFindAction(this.user.get('id')).on('success', function (user) {
          self.user.set('blurb', user.blurb);
          show(user.blurb);
        });
      }
      showModal(_arg);

      function show(blurb) {
        if (blurb) {
          self.$('.actions').before(div);
          span.append(emoji, ' ' + blurb);
          div.height(span[0].offsetHeight + 6);
          self.$el.css('top', (parseInt(self.$el.css('top'), 10) - div.height()) + 'px');
        }
      }
    },
    removeBlurb: function (hide, _arg) {
      this.$('.extplug-blurb-wrap').remove();
      hide(_arg);
    }

  });

});

(extp = window.extp || []).push('extplug/modules/rollover-blurbs/main');
