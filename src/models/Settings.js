import { Model } from 'backbone';

const metaSymbol = Symbol('settings schema');

export default class Settings extends Model {
  initialize(attrs, opts = {}) {
    this[metaSymbol] = opts.meta;
  }

  meta() {
    return this[metaSymbol];
  }
}
