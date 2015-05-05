define('extplug/plugins/room-styles/main', function (require, exports, module) {

  const Plugin = require('extplug/Plugin');
  const request = require('extplug/util/request');
  const Style = require('extplug/util/Style');
  const _ = require('underscore');
  const $ = require('jquery');

  const RoomStyles = Plugin.extend({
    name: 'Room Styles',

    init: function (id, ext) {
      this._super(id, ext);
      this.colors = this.colors.bind(this);
      this.css    = this.css.bind(this);
      this.images = this.images.bind(this);
      this.unload = this.unload.bind(this);
      this.reload = this.reload.bind(this);
    },

    enable: function () {
      this._super();
      this.all();

      this.ext.roomSettings.on('change', this.reload);

      this.ext.on('room:left', this.unload);
    },

    disable: function () {
      this._super();
      this.ext.roomSettings.off('change', this.reload);

      this.ext.off('room:left', this.unload);
    },

    reload: function () {
      this.unload();
      this.all();
    },

    colors: function () {
      var colors = this.ext.roomSettings.get('colors');
      if (_.isObject(colors)) {
        var colorStyles = this.Style();

        if (_.isObject(colors.chat)) {
          [ 'admin', 'ambassador', 'host', 'cohost', 'manager', 'bouncer', 'dj' ]
            .forEach(function (level) {
              if (colors.chat[level]) {
                var value = { color: '#' + colors.chat[level] + ' !important' };
                colorStyles
                  .set('#chat-messages .icon-chat-' + level + ' ~ .un', value)
                  .set('#user-rollover .icon-chat-' + level + ' + span', value)
                  .set('#user-lists    .icon-chat-' + level + ' + span', value)
                  .set('#waitlist      .icon-chat-' + level + ' + span', value);
              }
            });
        }
      }
    },

    css: function () {
      var css = this.ext.roomSettings.get('css');
      if (_.isObject(css)) {
        if (_.isObject(css.rule)) {
          this.Style(css.rule);
        }

        if (_.isArray(css.import)) {
          this._imports = $('<style>').text(
            css.import.map(function (url) {
              return '@import url(' + request.url(url) + ');';
            }).join('\n')
          );
        }
      }
    },

    images: function () {
      var images = this.ext.roomSettings.get('images');
      if (_.isObject(images)) {
        if (images.background) {
          this.Style({
            '.room-background': {
              'background-image': 'url(' + images.background + ') !important'
            }
          });
        }
        if (images.playback) {
          var playbackImg = this.$('#playback .background img');
          this._oldPlayback = playbackImg.attr('src');
          playbackImg.attr('src', images.playback);
        }
        if (images.booth) {
          this.Style({
            '.extplug-booth': {
              'position': 'absolute',
              'width': '300px',
              'height': '100px',
              'left': '15px',
              'top': '135px',
              'z-index': -1
            }
          });
          this.$booth = $('<div />')
            // plug³ compatibility
            .attr('id', 'p3-dj-booth')
            .addClass('extplug-booth')
            .css({ 'background': 'url(' + images.booth + ') no-repeat center center' })
            .appendTo(this.$('#dj-booth'));
        }
      }
    },

    all: function () {
      this.colors();
      this.css();
      this.images();
    },

    unload: function () {
      if (this.$booth) {
        this.$booth.remove();
      }
      if (this._oldPlayback) {
        this.$('#playback .background img').attr('src', this._oldPlayback);
        delete this._oldPlayback;
      }
      if (this._imports) {
        this._imports.remove();
        this._imports = null;
      }
      this.removeStyles();
    }

  });

  module.exports = RoomStyles;

});

(extp = window.extp || []).push('extplug/plugins/room-styles/main');
