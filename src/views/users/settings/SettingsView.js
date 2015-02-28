define('extplug/views/users/settings/SettingsView', function (require, exports, module) {
  var BaseView = require('extplug/views/BaseView'),
    ControlGroupView = require('extplug/views/users/settings/ControlGroupView'),
    ErrorCheckboxView = require('extplug/views/users/settings/ErrorCheckboxView'),
    CheckboxView = require('extplug/views/users/settings/CheckboxView'),
    DropdownView = require('extplug/views/users/settings/DropdownView'),
    _ = require('underscore'),
    $ = require('jquery');

  /**
   * Wires a control to a setting model, updating the model when the control changes.
   *
   * @param {Backbone.View} el Control view.
   * @param {Backbone.Model} settings Model to reflect the settings to.
   * @param {string} target Relevant property on the model.
   */
  function wireSettingToModel(el, settings, target) {
    el.on('change', function (value) {
      settings.set(target, value);
    });
  }

  var SettingsView = BaseView.extend({
    className: 'ext-plug section',

    initialize: function (o) {
      this.modules = o.modules;
      this.modules.on('reset add remove', this.refresh.bind(this));
      this.ext = o.ext;

      this.refresh();
    },

    refresh: function () {
      this.groups = [];
      this.addGroup(this.createModulesGroup(), 1000);
      this.addGroup(this.createExtPlugGroup(), 999);
      this.modules.forEach(function (mod) {
        // add module settings group for stuff that was already enabled
        if (mod.get('enabled')) {
          var moduleSettings = this.createSettingsGroup(mod);
          if (moduleSettings) {
            this.addGroup(moduleSettings);
          }
        }
      }, this)
    },

    render: function () {
      this.$container = $('<div>').addClass('container');
      this.$el.empty().append(this.$container);

      this.sort();
      this.groups.forEach(function (group) {
        this.$container.append(group.items.render().$el);
      }, this);

      return this;
    },

    createModulesGroup: function () {
      var view = this;
      var modulesGroup = new ControlGroupView({ name: 'Modules' });
      // generate module list
      this.modules.forEach(function (mod) {
        var module = mod.get('module'),
          name = mod.get('name');
        if (module instanceof Error) {
          // this module errored out during its initialization
          modulesGroup.add(new ErrorCheckboxView({ label: name }));
        }
        else {
          var box = new CheckboxView({
            label: name,
            description: module.description || false,
            enabled: mod.get('enabled')
          });
          modulesGroup.add(box);
          box.on('change', function (value) {
            // add / remove module settings group
            if (value) {
              mod.enable();
              var moduleSettings = view.createSettingsGroup(mod);
              if (moduleSettings) {
                view.addGroup(moduleSettings);
                view.$container.append(moduleSettings.render().$el);
              }
            }
            else {
              mod.disable();
              var moduleSettings = view.getGroup(name);
              if (moduleSettings) {
                view.removeGroup(name);
                moduleSettings.remove();
              }
            }
          });
        }
      });

      return modulesGroup;
    },
    createExtPlugGroup: function () {
      // global ExtPlug settings
      var extGroup = new ControlGroupView({ name: 'ExtPlug' });
      var useCorsProxy = new CheckboxView({ label: 'Use CORS proxy', enabled: true });
      extGroup.add(useCorsProxy);
      wireSettingToModel(useCorsProxy, this.ext.settings, 'corsProxy');
      return extGroup;
    },

    createSettingsGroup: function (mod) {
      var module = mod.get('module');
      if (!module._settings) {
        return;
      }
      var group = new ControlGroupView({ name: mod.get('name') });
      var meta = module._settings;
      var settings = module.settings;

      _.each(meta, function (setting, name) {
        var control;
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
              selected: setting.default
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

    sort: function () {
      this.groups.sort(function (a, b) {
        var c = b.priority - a.priority;
        if (c === 0) {
          c = a.name > b.name ? 1 : a.name < b.name ? -1 : 0;
        }
        return c;
      });
    },

    onResize: function () {
    },

    addGroup: function (items, priority) {
      this.groups.push({
        items: items,
        priority: typeof priority === 'number' ? priority : 0
      });
    },

    getGroup: function (name) {
      for (var i = 0, l = this.groups.length; i < l; i++) {
        if (this.groups[i].items.name === name) {
          return this.groups[i].items;
        }
      }
    },

    hasGroup: function (name) {
      return this.groups.some(function (group) {
        return group.items.name === name;
      });
    },

    removeGroup: function (name) {
      for (var i = 0, l = this.groups.length; i < l; i++) {
        if (this.groups[i].items.name === name) {
          return this.groups.splice(i, 1);
        }
      }
    }

  });

  module.exports = SettingsView;

});
