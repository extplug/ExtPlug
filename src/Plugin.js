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
      this._styles = [];

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
            this.removeStyles();
            this.trigger('disable');
            Plugin.trigger('disable', this);
          }
        }
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

    Style(o) {
      var style = new Style(o);
      this._styles.push(style);
      return style;
    },

    removeStyles() {
      while (this._styles.length > 0) {
        this._styles.pop().remove();
      }
    }
  });

  _.extend(Plugin, Backbone.Events);

  module.exports = Plugin;

});
