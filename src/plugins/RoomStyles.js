define('extplug/plugins/room-styles/main', function (require, exports, module) {

  const Plugin = require('extplug/Plugin');
  const request = require('extplug/util/request');
  const Style = require('extplug/util/Style');
  const _ = require('underscore');
  const $ = require('jquery');

  const ranks = [ 'subscriber',
                  'host', 'cohost', 'manager', 'bouncer', 'dj',
                  'admin', 'ambassador' ];

  const RoomStyles = Plugin.extend({
    name: 'Room Styles',
    description: 'Applies custom room-specific styles. ' +
                 'Supports both the plugCubed and Radiant Script formats.',

    init(id, ext) {
      this._super(id, ext);
      this.colors = this.colors.bind(this);
      this.css    = this.css.bind(this);
      this.images = this.images.bind(this);
      this.unload = this.unload.bind(this);
      this.reload = this.reload.bind(this);
    },

    enable() {
      this._super();
      this.all();

      this.ext.roomSettings.on('change', this.reload);
    },

    disable() {
      this._super();
      this.ext.roomSettings.off('change', this.reload);
    },

    reload() {
      this.unload();
      this.all();
    },

    colors() {
      // plugCubed
      let colors = this.ext.roomSettings.get('colors');
      // Radiant
      let ccc = this.ext.roomSettings.get('ccc');

      let chatColors = colors && colors.chat || ccc;
      if (_.isObject(chatColors)) {
        let colorStyles = this.Style();

        ranks.forEach(level => {
          if (chatColors[level]) {
            let color = chatColors[level];
            if (color[0] !== '#') color = `#${color}`;
            let value = { color: `${color} !important` };
            colorStyles
              .set(`#chat-messages .icon-chat-${level} ~ .un`, value)
              .set(`#user-rollover .icon-chat-${level} + span`, value)
              .set(`#user-lists    .icon-chat-${level} + span`, value)
              .set(`#waitlist      .icon-chat-${level} + span`, value);
          }
        });
      }
    },

    css() {
      let css = this.ext.roomSettings.get('css');
      // plugCubed
      if (_.isObject(css)) {
        if (_.isObject(css.rule)) {
          this.Style(css.rule);
        }

        if (_.isArray(css.import)) {
          this._imports = $('<style>').text(
            css.import.map(url => `@import url(${url});`).join('\n')
          ).appendTo('head');
        }
      }
      // Radiant
      else if (_.isString(css)) {
        this._imports = $('<style>').text(`@import url(${css});`).appendTo('head');
      }
    },

    images() {
      let images = this.ext.roomSettings.get('images');
      if (_.isObject(images)) {
        let style = this.Style();
        if (images.background) {
          style.set({
            '.room-background': {
              'background-image': 'url(' + images.background + ') !important'
            }
          });
        }
        if (images.playback) {
          let playbackImg = this.$('#playback .background img');
          this._oldPlayback = playbackImg.attr('src');
          playbackImg.attr('src', images.playback);
        }
        if (images.booth) {
          style.set({
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
        ranks.forEach(rank => {
          let url = images[rank] || images.icons && images.icons[rank];
          if (url) {
            style.set(`.icon.icon-chat-${rank}`, {
              background: `url(${url})`
            });
          }
        });
      }
    },

    all() {
      this.colors();
      this.css();
      this.images();
    },

    unload() {
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
