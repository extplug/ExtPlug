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

  getPackageUrl(name) {
    return `${this.apiUrl}/package/${encodeURIComponent(name)}`;
  }

  search(query) {
    const url = this.getSearchUrl(query);

    return requestJson(url).then(({ total, results }) => ({
      total,
      results: new Backbone.Collection(pluck(results, 'package').map((pkg) => {
        pkg.url = `https://unpkg.com/${pkg.name}`;
        return pkg;
      })),
    }));
  }

  getPackageInfo(name) {
    const url = this.getPackageUrl(name);

    return requestJson(url).then(({ collected }) =>
      new Backbone.Model(collected.metadata));
  }
}
