define(function (require, exports, module) {

  const jQuery = require('jquery');
  const _ = require('underscore');
  const Backbone = require('backbone');
  const Class = require('plug/core/Class');
  const Settings = require('extplug/models/Settings');
  const Style = require('extplug/util/Style');

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
      this.enable  = this.enable.bind(this);
      this.disable = this.disable.bind(this);
      this.$       = this.$.bind(this);
    },

    $(sel) {
      return jQuery(sel || document);
    },

    disable() {
      this.removeStyles();
    },
    enable() {
    },

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

  module.exports = Plugin;

});
