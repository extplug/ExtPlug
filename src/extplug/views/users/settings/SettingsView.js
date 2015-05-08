define(function (require, exports, module) {
  const BaseView = require('extplug/views/BaseView');
  const ControlGroupView = require('extplug/views/users/settings/ControlGroupView');
  const PluginsGroupView = require('./PluginsGroupView');
  const ManagingGroupView = require('./ManagingGroupView');
  const ErrorCheckboxView = require('extplug/views/users/settings/ErrorCheckboxView');
  const CheckboxView = require('extplug/views/users/settings/CheckboxView');
  const DropdownView = require('extplug/views/users/settings/DropdownView');
  const SliderView = require('extplug/views/users/settings/SliderView');
  const RemoveBoxView = require('./RemoveBoxView');
  const PluginMeta = require('extplug/models/PluginMeta');
  const Events = require('plug/core/Events');
  const _ = require('underscore');
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

  const SettingsView = BaseView.extend({
    className: 'ext-plug section',

    initialize(o) {
      this.plugins = o.plugins;
      this.plugins.on('reset add remove', () => {
        this.refresh()
        this.render();
      });
      this.ext = o.ext;
      this.mode = 'normal';

      this.refresh();
      this.manage = this.manage.bind(this);
      this.unmanage = this.unmanage.bind(this);

      Events.on('extplug:plugins:manage', this.manage);
      Events.on('extplug:plugins:unmanage', this.unmanage);
    },

    refresh() {
      this.groups = [];
      if (this.mode === 'manage') {
        this.addGroup(this.createPluginsManageGroup(), 1000);
      }
      else {
        this.addGroup(this.createPluginsGroup(), 1000);
      }
      this.addGroup(this.createExtPlugGroup(), 999);
      this.plugins.forEach(function (plugin) {
        // add plugin settings group for stuff that was already enabled
        if (plugin.get('enabled')) {
          var pluginSettings = this.createSettingsGroup(plugin);
          if (pluginSettings) {
            this.addGroup(pluginSettings);
          }
        }
      }, this)
    },

    manage() {
      this.mode = 'manage';
      this.refresh();
      this.render();
    },
    unmanage() {
      this.mode = 'normal';
      this.refresh();
      this.render();
    },

    render() {
      this.$container = $('<div>').addClass('container');
      this.$el.empty().append(this.$container);

      this.sort();
      this.groups.forEach(function (group) {
        this.$container.append(group.items.render().$el);
      }, this);

      return this;
    },

    createPluginsGroup() {
      let pluginsGroup = new PluginsGroupView({ name: 'Plugins' });
      // generate plugin list
      this.plugins.forEach(pluginMeta => {
        let plugin = pluginMeta.get('instance');
        let name = pluginMeta.get('name');
        let box = new CheckboxView({
          label: name,
          description: plugin.description || false,
          enabled: pluginMeta.get('enabled')
        });
        pluginsGroup.add(box);
        box.on('change', value => {
          // add / remove plugin settings group
          if (value) {
            pluginMeta.enable();
            let pluginSettings = this.createSettingsGroup(pluginMeta);
            if (pluginSettings) {
              this.addGroup(pluginSettings);
              this.$container.append(pluginSettings.render().$el);
            }
          }
          else {
            pluginMeta.disable();
            let pluginSettings = this.getGroup(name);
            if (pluginSettings) {
              this.removeGroup(name);
              pluginSettings.remove();
            }
          }
        });
      });

      return pluginsGroup;
    },
    createPluginsManageGroup  () {
      let pluginsGroup = new ManagingGroupView({ name: 'Manage Plugins' });
      // generate plugin list
      this.plugins.forEach(plugin => {
        pluginsGroup.add(new RemoveBoxView({ model: plugin }));
      });

      return pluginsGroup;
    },
    createExtPlugGroup() {
      return this.createSettingsGroup(new PluginMeta({
        instance: this.ext,
        name: 'ExtPlug'
      }));
    },

    createSettingsGroup(pluginMeta) {
      let plugin = pluginMeta.get('instance');
      if (!plugin._settings) {
        return;
      }
      let group = new ControlGroupView({ name: pluginMeta.get('name') });
      let meta = plugin._settings;
      let settings = plugin.settings;

      _.each(meta, (setting, name) => {
        let control;
        switch (setting.type) {
          case 'boolean':
            control = new CheckboxView({
              label: setting.label,
              enabled: settings.get(name)
            });
            break;
          case 'dropdown':
            control = new DropdownView({
              label: setting.label,
              options: setting.options,
              selected: settings.get(name)
            });
            break;
          case 'slider':
            control = new SliderView({
              label: setting.label,
              min: setting.min,
              max: setting.max,
              value: settings.get(name)
            });
            break;
          default:
            control = new ErrorCheckboxView({ label: 'Unknown type for "' + name + '"' });
            break;
        }
        wireSettingToModel(control, settings, name);
        group.add(control);
      });

      return group;
    },

    sort() {
      this.groups.sort(function (a, b) {
        var c = b.priority - a.priority;
        if (c === 0) {
          c = a.items.get('name') > b.items.get('name') ? 1
            : a.items.get('name') < b.items.get('name') ? -1
            : 0;
        }
        return c;
      });
    },

    onResize() {
    },

    addGroup(items, priority) {
      this.groups.push({
        items: items,
        priority: typeof priority === 'number' ? priority : 0
      });
    },

    getGroup(name) {
      for (let i = 0, l = this.groups.length; i < l; i++) {
        if (this.groups[i].items.name === name) {
          return this.groups[i].items;
        }
      }
    },

    hasGroup(name) {
      return this.groups.some(group => group.items.name === name);
    },

    removeGroup(name) {
      for (var i = 0, l = this.groups.length; i < l; i++) {
        if (this.groups[i].items.name === name) {
          return this.groups.splice(i, 1);
        }
      }
    }

  });

  module.exports = SettingsView;

});
