import { sortBy } from 'underscore';
import Backbone from 'backbone';
import html from 'bel';
import Events from 'plug/core/Events';
import ShowDialogEvent from 'plug/events/ShowDialogEvent';
import PluginSearchEngine from '../../PluginSearchEngine';
import InstallPluginDialog from '../dialogs/InstallPluginDialog';
import SearchBarView from './SearchBarView';
import PluginSearchResultsListView from './PluginSearchResultsListView';

const PluginsView = Backbone.View.extend({
  className: 'PluginsView DiscoverPluginsView',

  initialize() {
    this.searchResults = new Backbone.Collection();
    this.installedPlugins = window.extp.plugins;

    this.searchBarView = new SearchBarView({
      placeholder: 'Search Plugins',
    });
    this.resultsView = new PluginSearchResultsListView({
      collection: this.searchResults,
    });

    this.searchBarView.on('search', this.search, this);

    this.engine = new PluginSearchEngine();
  },

  render() {
    this.search('');

    this.$el.append(html`
      <div class="PluginsView-search DiscoverPluginsView-search">
        ${this.searchBarView.el}
        <button class="DiscoverPluginsView-url"
                onclick=${() => this.installByUrl()}>
          Install By URL
        </button>
    `, html`
      <div class="PluginsView-results">
        ${this.resultsView.el}
      </div>
    `);

    this.searchBarView.render();
    this.searchBarView.$el.addClass('DiscoverPluginsView-searchBar');
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
      // Move plugins that are already installed to the end of the list.
      const sortedResults = sortBy(resultsArray, 'installed');
      this.searchResults.reset(sortedResults);
    });
  },

  installByUrl() {
    Events.dispatch(new ShowDialogEvent(
      ShowDialogEvent.SHOW,
      new InstallPluginDialog(),
    ));
  },
});

export default PluginsView;
