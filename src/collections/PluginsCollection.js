import { Collection } from 'backbone';
import PluginMeta from '../models/PluginMeta';

const PluginsCollection = Collection.extend({
  model: PluginMeta,
  comparator(a, b) {
    return a.get('name') > b.get('name') ? 1
         : a.get('name') < b.get('name') ? -1
         : 0;
  }
});

export default PluginsCollection;
