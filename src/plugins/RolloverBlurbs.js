define('extplug/plugins/rollover-blurbs/main', function (require, exports, module) {

  var Plugin = require('extplug/Plugin'),
    rolloverView = require('plug/views/users/userRolloverView'),
    UserFindAction = require('plug/actions/users/UserFindAction'),
    $ = require('jquery'),
    meld = require('meld');

  var emoji = $('<span />').addClass('emoji-glow')
    .append($('<span />').addClass('emoji emoji-1f4dd'));

  module.exports = Plugin.extend({
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

      this.showAdvice = meld.around(rolloverView, 'showModal', this.addBlurb);
      this.hideAdvice = meld.before(rolloverView, 'hide', this.removeBlurb);
    },

    disable: function () {
      this._super();
      this.showAdvice.remove();
      this.hideAdvice.remove();
    },

    addBlurb(joinpoint) {
      this.$('.extplug-blurb-wrap').remove();
      var self = this;
      var span = $('<span />').addClass('extplug-blurb');
      var div = $('<div />').addClass('info extplug-blurb-wrap').append(span);
      if (this.user.get('blurb')) {
        show(this.user.get('blurb'));
      }
      else {
        new UserFindAction(this.user.get('id'))
          .on('success', user => {
            if (user.blurb) {
              self.user.set('blurb', user.blurb);
              show(user.blurb);
            }
          });
      }
      return joinpoint.proceed();

      function show(blurb) {
        if (blurb) {
          self.$('.actions').before(div);
          span.append(emoji, ` ${blurb}`);
          div.height(span[0].offsetHeight + 6);
          self.$el.css('top', (parseInt(self.$el.css('top'), 10) - div.height()) + 'px');
        }
      }
    },
    removeBlurb() {
      this.$('.extplug-blurb-wrap').remove();
    }

  });

});
