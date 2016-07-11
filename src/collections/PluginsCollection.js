import { Collection } from 'backbone';
import PluginMeta from '../models/PluginMeta';

export default class PluginsCollection extends Collection {
  model = PluginMeta;

  comparator(a, b) {
    if (a.get('name') > b.get('name')) {
      return 1;
    } else if (a.get('name') < b.get('name')) {
      return -1;
    }
    return 0;
  }
}
