import $ from 'jquery';
import { sortBy } from 'underscore';
import Backbone from 'backbone';
import PluginSearchEngine from '../../PluginSearchEngine';
import SearchBarView from './SearchBarView';
import PluginSearchResultsListView from './PluginSearchResultsListView';

const PluginsView = Backbone.View.extend({
  className: 'PluginsView',

  initialize() {
    this.searchResults = new Backbone.Collection();
    this.installedPlugins = window.extp.plugins;

    this.searchBarView = new SearchBarView();
    this.resultsView = new PluginSearchResultsListView({
      collection: this.searchResults,
    });

    this.searchBarView.on('search', this.search, this);

    this.engine = new PluginSearchEngine();
  },

  render() {
    this.search('');

    this.$el.append(
      $('<div class="PluginsView-search" />').append(this.searchBarView.$el),
      $('<div class="PluginsView-results" />').append(this.resultsView.$el),
    );

    this.searchBarView.render();
    this.resultsView.render();

    return this;
  },

  onResize() {
    this.resultsView.onResize();
  },

  search(query) {
    const isInstalled = plugin =>
      this.installedPlugins.some(installed =>
        installed.get('fullUrl') === plugin.get('url'));

    this.engine.search(query).then(({ results }) => {
      const resultsArray = results.map((plugin) => {
        plugin.set('installed', isInstalled(plugin));
        return plugin;
      });
      this.searchResults.reset(
        // Move plugins that are already installed to the end of the list.
        sortBy(resultsArray, 'installed'));
    });
  },
});

export default PluginsView;
