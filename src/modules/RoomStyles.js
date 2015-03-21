(extp = window.extp || []).push(function (ext) {

  ext.define('RoomStyles', function (require, exports, module) {

    var Module = require('extplug/Module'),
      request = require('extplug/util/request'),
      fnUtils = require('extplug/util/function'),
      _ = require('underscore'),
      $ = require('jquery');

    module.exports = Module.extend({
      name: 'Room Styles',

      init: function (id, ext) {
        this._super(id, ext);
        fnUtils.bound(this, 'colors');
        fnUtils.bound(this, 'css');
        fnUtils.bound(this, 'images');
        fnUtils.bound(this, 'unload');
      },

      enable: function () {
        this._super();
        this.all();

        this.ext.roomSettings
          .on('change:colors', this.colors)
          .on('change:css', this.css)
          .on('change:images', this.images);

        this.ext.on('room:left', this.unload);
      },

      disable: function () {
        this._super();
        this.ext.roomSettings
          .off('change:colors', this.colors)
          .off('change:css', this.css)
          .off('change:images', this.images);

        this.ext.off('room:left', this.unload);
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
                    .set('#chat-messages .icon-chat-' + level + ' ~ .from', value)
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
            this.$booth = $('<div />').css({
              'background': 'url(' + images.booth + ') no-repeat center center',
              'position': 'absolute',
              'width': '300px',
              'height': '100px',
              'left': '15px',
              'top': '70px',
              'z-index': -1
            }).appendTo(this.$('#dj-booth'));
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

  });

});
