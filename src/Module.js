define('extplug/Module', function (require, exports, module) {

  var jQuery = require('jquery'),
    _ = require('underscore'),
    Backbone = require('backbone'),
    SettingsGroup = require('extplug/settings/Group'),
    Settings = require('extplug/settings/Settings'),
    Style = require('extplug/Style');

  /**
   * @param {string}  name      Module name.
   * @param {Object=} prototype Module prototype.
   */
  function Module(prototype) {
    function Constructor(ext) {
      if (!(this instanceof Constructor)) return new Constructor(ext);
      _.extend(this, Backbone.Events);

      /**
       * @type {Array.<Style>}
       */
      this._styles = [];

      /**
       * @type {ExtPlug}
       */
      this.ext = ext;

      var settings = new Settings({});
      if (this.settings) {
        _.each(this.settings, function (setting, name) {
          settings.set(name, setting.default);
        });
        this._settings = this.settings;
      }
      this.settings = settings;

      this.refresh = this.refresh.bind(this);
      this.enable = this.enable.bind(this);
      this.disable = this.disable.bind(this);
      this.$ = this.$.bind(this);

      this.init();
    }

    Constructor._name = prototype.name;
    delete prototype.name;

    _.extend(Constructor.prototype, Module.prototype);

    if (prototype) {
      if (prototype.disable) {
        prototype._disable = prototype.disable;
        delete prototype.disable;
      }
      _.extend(Constructor.prototype, prototype);
    }

    return Constructor;
  }

  Module.prototype.init = function () {};

  Module.prototype.$ = function (sel) {
    return sel ? jQuery(sel, this.ext.document) : this.ext.document;
  };

  Module.prototype.disable = function () {
    if (this._disable) {
      this._disable();
    }
    this.removeStyles();
  };

  Module.prototype.refresh = function () {
    this.disable();
    this.enable();
  };

  Module.prototype.Style = function (o) {
    var style = new Style(o);
    this._styles.push(style);
    return style;
  };

  Module.prototype.removeStyles = function () {
    while (this._styles.length > 0) {
      this._styles.pop().remove();
    }
  };

  module.exports = Module;

});
