import { Model } from 'backbone';

const Settings = Model.extend({

  initialize(attrs, opts = {}) {
    this._meta = opts.meta;
  },

  meta() {
    return this._meta;
  }

});

export default Settings;
