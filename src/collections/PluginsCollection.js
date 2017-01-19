import { Collection } from 'backbone';
import PluginMeta from '../models/PluginMeta';
import compareBy from '../util/compareBy';

const PluginsCollection = Collection.extend({
  model: PluginMeta,
  comparator: compareBy('name'),
});

export default PluginsCollection;
