(extp = window.extp || []).push(function (ext) {

  ext.define('ChatNotifications', function (require, exports, module) {

    var Module = require('extplug/Module'),
      Events = require('plug/core/Events');

    module.exports = Module({
      name: 'Chat Notifications',

      settings: {
        userJoin: { type: 'boolean', label: 'User Join', default: true },
        userLeave: { type: 'boolean', label: 'User Leave', default: true },
        advance: { type: 'boolean', label: 'DJ Advance', default: true },
        grab: { type: 'boolean', label: 'Media Grab', default: true },
        meh: { type: 'boolean', label: 'Meh Vote', default: true }
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
          this.log('joined the room', e.id, e.username, '#2ECC40');
        }
      },

      onLeave: function (e) {
        if (this.settings.get('userLeave')) {
          this.log('left the room', e.id, e.username, '#FF4136');
        }
      },

      onAdvance: function (e) {
        if (this.settings.get('advance')) {
          this.log('Now Playing: ' + e.media.author + ' – ' + e.media.title, e.dj.id, e.dj.username, '#7FDBFF');
        }
      },

      onGrab: function (e) {
        if (this.settings.get('grab')) {
          var media = API.getMedia();
          this.log('grabbed ' + media.author + ' – ' + media.title, e.user.id, e.user.username, '#B10DC9');
        }
      },

      log: function (msg, uid, username, color, badge) {
        Events.trigger('chat:receive', {
          type: 'custom',
          color: color,
          message: msg,
          uid: uid,
          un: username
        });
      }
    });

  });

});
