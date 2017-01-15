import { extend, without } from 'underscore';

// Try to parse as JSON, defaulting to an empty object.
function jsonParse(str) {
  try {
    return JSON.parse(str) || {};
  } catch (e) {
    return {};
  }
}

// LocalStorage key name for extplug
const LS_NAME = 'extPlugins';

class PluginLocalStorage {
  constructor({ version, key = LS_NAME } = {}) {
    this.key = key;

    if (version) {
      this.data = extend(this.data, { version });
    }
  }

  get data() {
    return jsonParse(localStorage.getItem(this.key));
  }

  set data(value) {
    localStorage.setItem(this.key, JSON.stringify(value));
  }

  /**
   * Get an array of installed plugin URLs.
   */
  getInstalledPlugins() {
    return Promise.resolve(this.data.installed);
  }

  /**
   * Add a newly installed plugin.
   */
  installPlugin(url) {
    const data = this.data;

    if (!data.installed) {
      data.installed = [];
    }
    if (data.installed.indexOf(url) === -1) {
      data.installed.push(url);
    }

    this.data = data;
    return Promise.resolve();
  }

  /**
   * Remove a plugin.
   */
  removePlugin(url) {
    const data = this.data;

    if (data.installed) {
      data.installed = without(data.installed, url);
    }

    this.data = data;
    return Promise.resolve();
  }

  /**
   * Return the current settings for a given plugin.
   */
  getPluginSettings(name) {
    const settings = this.data.plugins;
    if (settings && name in settings) {
      return Promise.resolve(settings[name]);
    }
    return Promise.resolve({ enabled: false, settings: {} });
  }

  /**
   * Store settings for a plugin.
   */
  setPluginSettings(name, { enabled, settings }) {
    const data = this.data;
    if (!data.plugins) {
      data.plugins = {};
    }

    data.plugins[name] = { enabled, settings };

    this.data = data;
  }
}

export default PluginLocalStorage;
