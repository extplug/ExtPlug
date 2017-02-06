import $ from 'jquery';
import Backbone from 'backbone';
import InstalledPluginsListView from './InstalledPluginsListView';

const PluginsView = Backbone.View.extend({
  className: 'InstalledPluginsView',

  initialize() {
    this.installedPlugins = window.extp.plugins;

    this.pluginsView = new InstalledPluginsListView({
      collection: this.installedPlugins,
    });
  },

  render() {
    this.$el.append(
      $('<div class="InstalledPluginsView-list" />').append(this.pluginsView.$el),
    );

    this.pluginsView.render();

    return this;
  },

  onResize() {
    this.pluginsView.onResize();
  },
});

export default PluginsView;
