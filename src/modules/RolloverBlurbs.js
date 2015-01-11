(extp = window.extp || []).push(function (ext) {

  ext.define('RolloverBlurbs', function (require, exports, module) {

    var Module = require('extplug/Module'),
      fnUtils = require('extplug/util/function'),
      rolloverView = require('plug/views/user/userRolloverView'),
      UserFindAction = require('plug/actions/user/UserFindAction'),
      $ = require('jquery');

    module.exports = Module({
      name: 'Rollover Blurb (Experimental)',
      description: 'Show user "Blurb" / bio in rollover popups.',

      init: function () {
        fnUtils.bound(this, 'onRollover');
      },

      enable: function () {
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

        var emoji = $('<span />').addClass('emoji-glow')
          .append($('<span />').addClass('emoji emoji-1f4dd'));
        fnUtils.replaceMethod(rolloverView, 'showModal', function (showModal, _arg) {
          var self = this;
          if (this._extPlugBlurbDiv) {
            this._extPlugBlurbDiv.remove();
          }
          var span = $('<span />').addClass('extplug-blurb');
          var div = this._extPlugBlurbDiv = $('<div />').addClass('info').append(span);
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
        });
        fnUtils.replaceMethod(rolloverView, 'hide', function (hide, _arg) {
          if (this._extPlugBlurbDiv) {
            this._extPlugBlurbDiv.remove();
            delete this._extPlugBlurbDiv;
          }
          hide(_arg);
        });
      },

      disable: function () {},

      onRollover: function () {

      }

    });

  });

});