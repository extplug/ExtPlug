define(function (require, exports, module) {
  const { View } = require('backbone');
  const ControlGroupView = require('./ControlGroupView');
  const PluginsGroupView = require('./PluginsGroupView');
  const CheckboxView = require('./CheckboxView');
  const RemoveBoxView = require('./RemoveBoxView');
  const PluginMeta = require('../../../models/PluginMeta');
  const Events = require('plug/core/Events');
  const window = require('plug/util/window');
  const { defer } = require('underscore');
  const $ = require('jquery');

  /**
   * Wires a control to a setting model, updating the model when the control changes.
   *
   * @param {Backbone.View} el Control view.
   * @param {Backbone.Model} settings Model to reflect the settings to.
   * @param {string} target Relevant property on the model.
   */
  function wireSettingToModel(view, settings, target) {
    view.on('change', function (value) {
      settings.set(target, value);
    });
  }

  const SettingsView = View.extend({
    className: 'ext-plug section',

    initialize(o) {
      this.plugins = o.plugins;
      this.ext = o.ext;

      this.refresh();

      this.plugins
        .on('change:enabled', this.onEnabledChange, this)
        .on('reset add remove', this.onUpdate, this);
    },

    remove() {
      this.plugins
        .on('change:enabled', this.onEnabledChange)
        .off('reset add remove', this.onUpdate);
    },

    onUpdate() {
      this.refresh();
      this.render();
    },

    onEnabledChange() {
      // TODO only add/remove changed groups
      this.onUpdate();
    },

    refresh() {
      this.groups = [];
      this.addGroup('Plugins', this.createPluginsGroup(), 1000);
      this.addGroup('ExtPlug', this.createExtPlugGroup(), 999);
      this.plugins.forEach(function (plugin) {
        // add plugin settings group for stuff that was already enabled
        if (plugin.get('enabled')) {
          let pluginSettings = this.createSettingsGroup(plugin);
          if (pluginSettings) {
            this.addGroup(plugin.get('name'), pluginSettings);
          }
        }
      }, this);
    },

    render() {
      if (this.scrollPane) {
        this.scrollPane.destroy();
        defer(() => {
          let size = window.getSize();
          this.onResize(size.width, size.height);
        });
      }
      this.$container = $('<div>').addClass('container');
      this.$el.empty().append(this.$container);

      this.sort();
      this.groups.forEach(function (group) {
        let header = $('<div />').addClass('header').append(
          $('<span>').text(group.name)
        );
        group.view.render();
        this.$container
          .append(header)
          .append(group.view.$el);
      }, this);

      this.$container.jScrollPane();
      this.scrollPane = this.$container.data('jsp');

      return this;
    },

    createPluginsGroup() {
      let pluginsGroup = new PluginsGroupView({
        collection: this.plugins
      });
      return pluginsGroup;
    },
    createExtPlugGroup() {
      return this.ext.getSettingsView();
    },

    createSettingsGroup(pluginMeta) {
      let plugin = pluginMeta.get('instance');
      if (!plugin._settings) {
        return;
      }

      return plugin.getSettingsView();
    },

    sort() {
      this.groups.sort((a, b) => {
        let c = b.priority - a.priority;
        if (c === 0) {
          c = a.name > b.name ? 1
            : a.name < b.name ? -1
            : 0;
        }
        return c;
      });
    },

    onResize(w, h) {
      this.$container.height(h - this.$container.offset().top);
      if (this.scrollPane) {
        this.scrollPane.reinitialise();
      }
    },

    addGroup(name, view, priority) {
      this.groups.push({
        name: name,
        view: view,
        priority: typeof priority === 'number' ? priority : 0
      });
    },

    getGroup(name) {
      for (let i = 0, l = this.groups.length; i < l; i++) {
        if (this.groups[i].name === name) {
          return this.groups[i].view;
        }
      }
    },

    hasGroup(name) {
      return this.groups.some(group => group.name === name);
    },

    removeGroup(name) {
      for (let i = 0, l = this.groups.length; i < l; i++) {
        if (this.groups[i].name === name) {
          return this.groups.splice(i, 1);
        }
      }
    }

  });

  module.exports = SettingsView;

});
