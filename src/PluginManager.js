import PluginsCollection from './collections/PluginsCollection';
import PluginLoader from './PluginLoader';
import PluginLocalStorage from './PluginLocalStorage';

class PluginManager {
  constructor({
    loader = new PluginLoader(),
    storage = new PluginLocalStorage(),
  }) {
    this.loader = loader;
    this.storage = storage;

    this.pluginInstances = new PluginsCollection();

    this.load = this.load.bind(this);
  }

  getPluginMeta(id) {
    return this.pluginInstances.find(plugin => plugin.get('id') === id);
  }

  getPlugin(id) {
    const meta = this.getPluginMeta(id);
    return meta ? meta.get('instance') : null;
  }

  install(url) {
    return this.load(url)
      .then(plugin => this.storage.installPlugin(plugin.url));
  }

  uninstall(url) {
    return this.storage.removePlugin(url)
      .then(() => this.unload(url));
  }

  load(url) {
    return this.loader.load(url).then((meta) => {
      this.pluginInstances.add(meta);

      const instance = meta.get('instance');
      const id = meta.get('id');

      const onChange = () => {
        this.storage.setPluginSettings(id, {
          enabled: meta.get('enabled'),
          settings: instance.settings,
        });
      };

      return this.storage.getPluginSettings(id).then(({ enabled, settings }) => {
        instance.settings.set(settings);

        // Attach the settings handler early, in case the `enable()` call
        // changes settings.
        instance.settings.on('change', onChange);
        if (enabled) {
          meta.enable();
        }

        // This handler is attached _after_ enabling to prevent the `enable()`
        // call from always triggering a save.
        meta.on('change:enabled', onChange);

        return meta;
      });
    });
  }

  unload(url) {
    const plugin = this.getPluginMeta(url);
    if (plugin) {
      try {
        plugin.disable();
      } catch (e) {
        console.error('Error disabling plugin', url);
        console.error(e.stack || e.message || e);
      }

      this.pluginInstances.remove(plugin);
    }

    return this.loader.unload(url);
  }

  unloadAll() {
    return Promise.all(this.pluginInstances.map(meta => this.unload(meta.get('id'))));
  }

  loadInstalledPlugins() {
    return this.storage.getInstalledPlugins().then(
      installed => Promise.all(installed.map(this.load)));
  }
}

export default PluginManager;
