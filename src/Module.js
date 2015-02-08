define('extplug/Module', function (require, exports, module) {

  var jQuery = require('jquery'),
    _ = require('underscore'),
    Backbone = require('backbone'),
    SettingsGroup = require('extplug/settings/Group'),
    Settings = require('extplug/models/Settings'),
    Style = require('extplug/Style'),
    fnUtils = require('extplug/util/function');

  /**
   * @param {string}  name      Module name.
   * @param {Object=} prototype Module prototype.
   */
  function Module(prototype) {
    function Constructor(id, ext) {
      if (!(this instanceof Constructor)) return new Constructor(ext);
      _.extend(this, Backbone.Events);

      this.id = id;

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
      this.loadSettings();

      fnUtils.bound(this, 'refresh');
      fnUtils.bound(this, 'enable');
      fnUtils.bound(this, 'disable');
      fnUtils.bound(this, '$');
      fnUtils.bound(this, 'saveSettings');

      this.settings.on('change', this.saveSettings);

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

  Module.prototype.loadSettings = function () {
    var settings = localStorage.getItem('extPlugModule_' + this.id);
    if (settings) {
      this.settings.set(JSON.parse(settings));
    }
  };

  Module.prototype.saveSettings = function () {
    localStorage.setItem('extPlugModule_' + this.id, JSON.stringify(this.settings));
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
