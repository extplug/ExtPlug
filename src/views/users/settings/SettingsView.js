import $ from 'jquery';
import { defer } from 'underscore';
import { View } from 'backbone';
import window from 'plug/util/window';
import PluginsGroupView from './PluginsGroupView';

export default class SettingsView extends View {
  className = 'ext-plug section';

  initialize(o) {
    this.plugins = o.plugins;
    this.ext = o.ext;

    this.refresh();

    this.plugins
      .on('change:enabled', this.onEnabledChange, this)
      .on('reset add remove', this.onUpdate, this);
  }

  remove() {
    this.plugins
      .on('change:enabled', this.onEnabledChange)
      .off('reset add remove', this.onUpdate);
  }

  onUpdate() {
    this.refresh();
    this.render();
  }

  onEnabledChange() {
    // TODO only add/remove changed groups
    this.onUpdate();
  }

  refresh() {
    this.groups = [];
    this.addGroup('Plugins', this.createPluginsGroup(), 1000);
    this.addGroup('ExtPlug', this.createExtPlugGroup(), 999);
    this.plugins.forEach((plugin) => {
      // add plugin settings group for stuff that was already enabled
      if (plugin.get('enabled')) {
        const pluginSettings = this.createSettingsGroup(plugin);
        if (pluginSettings) {
          this.addGroup(plugin.get('name'), pluginSettings);
        }
      }
    });
  }

  render() {
    if (this.scrollPane) {
      this.scrollPane.destroy();
      defer(() => {
        const size = window.getSize();
        this.onResize(size.width, size.height);
      });
    }
    this.$container = $('<div>').addClass('container');
    this.$el.empty().append(this.$container);

    this.sort();
    this.groups.forEach((group) => {
      const header = $('<div />').addClass('header').append(
        $('<span>').text(group.name)
      );
      group.view.render();
      this.$container
        .append(header)
        .append(group.view.$el);
    });

    this.$container.jScrollPane();
    this.scrollPane = this.$container.data('jsp');

    return this;
  }

  createPluginsGroup() {
    const pluginsGroup = new PluginsGroupView({
      collection: this.plugins,
    });
    return pluginsGroup;
  }
  createExtPlugGroup() {
    return this.ext.getSettingsView();
  }

  createSettingsGroup(pluginMeta) {
    const plugin = pluginMeta.get('instance');
    if (!plugin._settings) { // eslint-disable-line no-underscore-dangle
      return null;
    }

    return plugin.getSettingsView();
  }

  sort() {
    this.groups.sort((a, b) => {
      let c = b.priority - a.priority;
      if (c === 0) {
        if (a.name > b.name) {
          c = 1;
        } else if (a.name < b.name) {
          c = -1;
        }
      }
      return c;
    });
  }

  onResize(w, h) {
    this.$container.height(h - this.$container.offset().top);
    if (this.scrollPane) {
      this.scrollPane.reinitialise();
    }
  }

  addGroup(name, view, priority) {
    this.groups.push({
      name,
      view,
      priority: typeof priority === 'number' ? priority : 0,
    });
  }

  getGroup(name) {
    for (let i = 0, l = this.groups.length; i < l; i += 1) {
      if (this.groups[i].name === name) {
        return this.groups[i].view;
      }
    }
    return null;
  }

  hasGroup(name) {
    return this.groups.some(group => group.name === name);
  }

  removeGroup(name) {
    for (let i = 0, l = this.groups.length; i < l; i += 1) {
      if (this.groups[i].name === name) {
        return this.groups.splice(i, 1);
      }
    }
    return null;
  }
}
