import Backbone from 'backbone';
import { pluck } from 'underscore';
import { json as requestJson } from './util/request';

export default class PluginSearchEngine {
  constructor() {
    this.apiUrl = 'https://api.npms.io/v2';
  }

  getSearchUrl(query) {
    return `${this.apiUrl}/search?q=keywords:extplug-plugin ${encodeURIComponent(query)}`;
  }

  search(query) {
    const url = this.getSearchUrl(query);

    return requestJson(url).then(({ total, results }) => ({
      total,
      results: new Backbone.Collection(pluck(results, 'package')),
    }));
  }
}
