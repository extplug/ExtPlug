import Backbone from 'backbone';
import html from 'bel';
import InstalledPluginsListView from './InstalledPluginsListView';
import SearchBarView from './SearchBarView';

function matchPlugin(q) {
  return (plugin) => {
    if (plugin.get('name').toLowerCase().indexOf(q) !== -1) {
      return true;
    }
    return false;
  };
}

const PluginsView = Backbone.View.extend({
  className: 'PluginsView',

  initialize() {
    this.installedPlugins = window.extp.plugins;
    this.filteredPlugins = new Backbone.Collection();
    this.filter('');

    this.filterView = new SearchBarView({
      placeholder: 'Filter',
    });
    this.pluginsView = new InstalledPluginsListView({
      collection: this.filteredPlugins,
    });

    this.filterView.on('search', this.filter, this);
  },

  render() {
    this.$el.append(html`
      <div class="PluginsView-search">
        ${this.filterView.el}
      </div>
    `, html`
      <div class="PluginsView-results">
        ${this.pluginsView.el}
      </div>
    `);

    this.filterView.render();
    this.pluginsView.render();

    return this;
  },

  onResize() {
    this.pluginsView.onResize();
  },

  filter(query) {
    this.filteredPlugins.reset(
      this.installedPlugins.toArray()
        .filter(matchPlugin(query.toLowerCase())));
  },
});

export default PluginsView;
