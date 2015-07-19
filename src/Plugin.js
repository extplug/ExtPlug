define(function (require, exports, module) {

  const jQuery = require('jquery');
  const _ = require('underscore');
  const Backbone = require('backbone');
  const Class = require('plug/core/Class');
  const Settings = require('./models/Settings');
  const Style = require('./util/Style');

  const stubHook = function () {};

  const Plugin = Class.extend({
    init(id, ext) {
      _.extend(this, Backbone.Events);

      this.id = id;
      this.ext = ext;

      let settings = new Settings({});
      if (this.settings) {
        _.each(this.settings, (setting, name) => {
          settings.set(name, setting.default);
        });
        this._settings = this.settings;
      }
      this.settings = settings;

      this.refresh = this.refresh.bind(this);
      this.$ = this.$.bind(this);

      // dis/enable hooks used to require _super() calls which were easy to
      // forget. now, we attach events if the methods have been defined.
      // it's all a bit ugly but...
      if (this.enable !== stubHook) {
        this.on('enable', this.enable, this);
      }
      if (this.disable !== stubHook) {
        this.on('disable', this.disable, this);
      }

      // prevent overwriting dis/enable hooks later
      // use the events if you need to do additional work
      Object.defineProperties(this, {
        enable: {
          value: () => {
            this.trigger('enable');
            Plugin.trigger('enable', this);
          }
        },
        disable: {
          value: () => {
            this.trigger('disable');
            Plugin.trigger('disable', this);
          }
        }
      });

      // Styles API
      this._styles = [];
      if (this.style) {
        // declarative `style: {}` API
        this.on('enable', () => {
          this.createStyle(this.style);
        });
      }
      this.on('disable', () => {
        this.removeStyles();
      });
    },

    $(sel) {
      return jQuery(sel || document);
    },

    // obsolete, but some plugins call _super()
    disable: stubHook,
    enable: stubHook,

    refresh() {
      this.disable();
      this.enable();
    },

    // Styles API
    createStyle(defaults = {}) {
      let style = new Style(defaults);
      this._styles.push(style);
      return style;
    },
    Style(defaults) {
      console.warn(`[${this.id}] Plugin#Style is deprecated. ` +
                   `Use Plugin#createStyle instead.`);
      return this.createStyle(defaults);
    },
    removeStyles() {
      if (this._styles) {
        this._styles.forEach(style => style.remove());
      }
      this._styles = [];
    }
  });

  _.extend(Plugin, Backbone.Events);

  module.exports = Plugin;

});
