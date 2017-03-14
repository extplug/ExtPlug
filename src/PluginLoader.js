import PluginMeta from './models/PluginMeta';

/**
 * Return the global Require.js function.
 */
function getRequireJs() {
  return window.requirejs;
}

/**
 * Parse a plugin URL into an object containing its parts. Old plugins normally
 * used the require.js optimizer for bundling, and exposed multiple require.js
 * modules. New plugins tend to be built using Webpack and expose a single
 * anonymous module, which can be `require`d by its URL alone.
 * Because old plugins exposed multiple named require.js modules, they cannot
 * be loaded by their URL alone, but we also need to know the entry point module
 * name. A plugin URL of the form `<url>;<entry-point>` was used to accomplish
 * that.
 */
function parseLegacyPluginUrl(name) {
  const parts = name.split(';');
  const o = {};
  o.url = parts[0];
  if (parts[1]) {
    o.name = parts[1];
  }

  // force https
  o.url = o.url.replace(/^http:/, 'https:');

  return o;
}

export default class PluginLoader {
  constructor() {
    this.require = getRequireJs();
  }

  /**
   * Add a module name alias to the plugin URL. This way, when we
   * require([ module name ]), the plugin URL will be loaded instead. Then, the
   * plugin URL will define() the module name anyway, and requirejs will figure
   * everything out.
   */
  injectModuleAlias(o) {
    this.require({
      paths: {
        // Chopping off the .js extension because require.js adds it
        // since we're actually requiring a module name and not a path.
        [o.name]: o.url.replace(/\.js$/, ''),
      },
    });
  }

  /**
   * Load a plugin.
   */
  load(url) {
    const o = parseLegacyPluginUrl(url);
    if (o.name) {
      this.injectModuleAlias(o);
    }

    const pluginId = o.name || o.url;
    const onLoad = resolve => (module) => {
      const PluginClass = module.default || module;
      const instance = new PluginClass(pluginId, window.extp);
      const meta = new PluginMeta({
        id: pluginId,
        fullUrl: o.url,
        name: instance.name,
        description: instance.description,
        instance,
        class: PluginClass,
      });
      resolve(meta);
    };

    return new Promise((resolve, reject) => {
      this.require([pluginId], onLoad(resolve), reject);
    });
  }

  /**
   * Unload a plugin.
   */
  unload(url) {
    // Attempt to remove the plugin from the require.js registry. This doesn't
    // work for plugins using the legacy URL format.
    this.require.undef(url);

    return Promise.resolve();
  }
}
