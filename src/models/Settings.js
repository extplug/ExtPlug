import { Model } from 'backbone';

const metaSymbol = Symbol('settings schema');

const Settings = Model.extend({
  initialize(attrs, opts = {}) {
    this[metaSymbol] = opts.meta;
  },

  meta() {
    return this[metaSymbol];
  },
});

export default Settings;
