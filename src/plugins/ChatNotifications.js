define('extplug/plugins/chat-notifications/main', function (require, exports, module) {

  var Plugin = require('extplug/Plugin'),
    Events = require('plug/core/Events');

  module.exports = Plugin.extend({
    name: 'Chat Notifications',

    settings: {
      inline: { type: 'boolean', label: 'Small Notifications', default: true },
      userJoin: { type: 'boolean', label: 'User Join', default: true },
      userLeave: { type: 'boolean', label: 'User Leave', default: true },
      advance: { type: 'boolean', label: 'DJ Advance', default: true },
      grab: { type: 'boolean', label: 'Media Grab', default: true },
      meh: { type: 'boolean', label: 'Meh Vote', default: true }
    },

    init: function (id, ext) {
      this._super(id, ext);
      this.onJoin = this.onJoin.bind(this);
      this.onLeave = this.onLeave.bind(this);
      this.onAdvance = this.onAdvance.bind(this);
      this.onGrab = this.onGrab.bind(this);
      this.onVote = this.onVote.bind(this);
      this.onInline = this.onInline.bind(this);
    },

    enable: function () {
      this._super();
      API.on(API.USER_JOIN, this.onJoin);
      API.on(API.BEFORE_USER_LEAVE, this.onLeave);
      API.on(API.ADVANCE, this.onAdvance);
      API.on(API.GRAB_UPDATE, this.onGrab);
      API.on(API.VOTE_UPDATE, this.onVote);
      this.settings.on('change:inline', this.onInline);

      this.Style({
        '.cm.extplug-user-join .msg':  { 'color': '#2ecc40' },
        '.cm.extplug-user-leave .msg': { 'color': '#ff851b' },
        '.cm.extplug-advance .msg':    { 'color': '#7fdbff' },
        '.cm.extplug-grab .msg':       { 'color': '#a670fe' },
        '.cm.extplug-meh .msg':        { 'color': '#ff4136' }
      });
    },

    disable: function () {
      this._super();
      API.off(API.USER_JOIN, this.onJoin);
      API.off(API.BEFORE_USER_LEAVE, this.onLeave);
      API.off(API.ADVANCE, this.onAdvance);
      API.off(API.GRAB_UPDATE, this.onGrab);
      API.off(API.VOTE_UPDATE, this.onVote);
    },

    _class: function () {
      return 'custom extplug-notification ' + (this.settings.get('inline') ? 'inline ' : '');
    },

    onInline: function () {
      var nots = this.$('#chat-messages .extplug-notification');
      if (this.settings.get('inline')) {
        nots.filter(':not(.extplug-advance)').addClass('inline');
      }
      else {
        nots.removeClass('inline');
      }
    },

    onJoin: function (e) {
      if (this.settings.get('userJoin')) {
        Events.trigger('chat:receive', {
          type: this._class() + 'extplug-user-join',
          message: 'joined the room',
          uid: e.id,
          un: e.username,
          badge: 'icon-community-users'
        });
      }
    },

    onLeave: function (user) {
      if (this.settings.get('userLeave')) {
        Events.trigger('chat:receive', {
          type: this._class() + 'extplug-user-leave',
          message: 'left the room',
          uid: user.id,
          un: user.username,
          badge: 'icon-community-users'
        });
      }
    },

    onAdvance: function (e) {
      if (this.settings.get('advance')) {
        Events.trigger('chat:receive', {
          type: 'custom extplug-advance',
          message: e.media.author + ' – ' + e.media.title,
          uid: e.dj.id,
          un: e.dj.username,
          badge: 'icon-play-next'
        });
      }
    },

    onGrab: function (e) {
      if (this.settings.get('grab')) {
        var media = API.getMedia();
        Events.trigger('chat:receive', {
          type: this._class() + 'extplug-grab',
          message: 'grabbed this track',
          uid: e.user.id,
          un: e.user.username,
          badge: 'icon-grab'
        });
      }
    },

    onVote: function (e) {
      if (this.settings.get('meh') && e.vote === -1) {
        Events.trigger('chat:receive', {
          type: this._class() + 'extplug-meh',
          message: 'meh\'d this track',
          uid: e.user.id,
          un: e.user.username,
          badge: 'icon-meh'
        });
      }
    }
  });

});
