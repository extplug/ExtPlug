import { Model } from 'backbone';

const PluginMeta = Model.extend({
  defaults: {
    id: '',
    fullUrl: '',
    enabled: false,
    name: '',
    description: '',
    instance: null,
    class: null,
  },

  initialize() {
    this.get('instance')
      .on('enable', () => this.set('enabled', true))
      .on('disable', () => this.set('enabled', false));
  },

  enable() {
    if (!this.get('enabled')) {
      this.get('instance').enable();
    }
  },

  disable() {
    if (this.get('enabled')) {
      try {
        this.get('instance').disable();
      } catch (e) {
        console.error('Error disabling plugin', this.get('id'));
        console.error(e.stack || e.message || e);
      } finally {
        this.set('enabled', false);
      }
    }
  },
});

export default PluginMeta;
