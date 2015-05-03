define(function (require, exports, module) {

  var jQuery = require('jquery'),
    _ = require('underscore'),
    Backbone = require('backbone'),
    Class = require('plug/core/Class'),
    Settings = require('extplug/models/Settings'),
    Style = require('extplug/util/Style'),
    fnUtils = require('extplug/util/function');

  var Plugin = Class.extend({
    init: function (id, ext) {
      _.extend(this, Backbone.Events);

      this.id = id;
      this.ext = ext;
      this._styles = [];

      var settings = new Settings({});
      if (this.settings) {
        _.each(this.settings, function (setting, name) {
          settings.set(name, setting.default);
        });
        this._settings = this.settings;
      }
      this.settings = settings;

      fnUtils.bound(this, 'refresh');
      fnUtils.bound(this, 'enable');
      fnUtils.bound(this, 'disable');
      fnUtils.bound(this, '$');
    },

    $: function (sel) {
      return sel ? jQuery(sel, this.ext.document) : this.ext.document;
    },

    disable: function () {
      this.removeStyles();
    },
    enable: function () {
    },

    refresh: function () {
      this.disable();
      this.enable();
    },

    Style: function (o) {
      var style = new Style(o);
      this._styles.push(style);
      return style;
    },

    removeStyles: function () {
      while (this._styles.length > 0) {
        this._styles.pop().remove();
      }
    }
  });

  module.exports = Plugin;

});
