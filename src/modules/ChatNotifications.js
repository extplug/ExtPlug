(extp = window.extp || []).push(function (ext) {

  ext.define('ChatNotifications', function (require, exports, module) {

    var Module = require('extplug/Module'),
      Events = require('plug/core/Events');

    module.exports = Module({
      name: 'Chat Notifications',

      settings: {
        userJoin: { type: Boolean, label: 'User Join', default: true },
        userLeave: { type: Boolean, label: 'User Leave', default: true },
        advance: { type: Boolean, label: 'DJ Advance', default: true },
        grab: { type: Boolean, label: 'Media Grab', default: true },
        meh: { type: Boolean, label: 'Meh Vote', default: true }
      },

      init: function () {
        this.onJoin = this.onJoin.bind(this);
        this.onLeave = this.onLeave.bind(this);
        this.onAdvance = this.onAdvance.bind(this);
        this.onGrab = this.onGrab.bind(this);
      },

      enable: function () {
        API.on(API.USER_JOIN, this.onJoin);
        API.on(API.USER_LEAVE, this.onLeave);
        API.on(API.ADVANCE, this.onAdvance);
        API.on(API.GRAB_UPDATE, this.onGrab);
      },

      disable: function () {
        API.off(API.USER_JOIN, this.onJoin);
        API.off(API.USER_LEAVE, this.onLeave);
        API.off(API.ADVANCE, this.onAdvance);
        API.off(API.GRAB_UPDATE, this.onGrab);
      },

      onJoin: function (e) {
        if (this.settings.get('userJoin')) {
          this.log(e.username + ' joined the room');
        }
      },

      onLeave: function (e) {
        if (this.settings.get('userLeave')) {
          this.log(e.username + ' left the room');
        }
      },

      onAdvance: function (e) {
        if (this.settings.get('advance')) {
          this.log('Now Playing: ' + e.media.author + ' – ' + e.media.title);
        }
      },

      onGrab: function (e) {
        if (this.settings.get('grab')) {
          var media = API.getMedia();
          this.log(e.user.username + ' grabbed ' + media.author + ' – ' + media.title);
        }
      },

      log: function (msg) {
        Events.trigger('chat:receive', {
          type: 'custom',
          color: '#700',
          message: msg
        });
      }
    });

  });

});