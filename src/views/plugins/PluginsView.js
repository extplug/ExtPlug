import $ from 'jquery';
import Backbone from 'backbone';
import PluginSearchEngine from '../../PluginSearchEngine';
import SearchBarView from './SearchBarView';
import PluginSearchResultsListView from './PluginSearchResultsListView';

const PluginsView = Backbone.View.extend({
  className: 'PluginsView',

  initialize() {
    this.searchResults = new Backbone.Collection();

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
    this.engine.search(query).then(({ results }) => {
      this.searchResults.reset(results.toArray());
    });
  },
});

export default PluginsView;
