define(function (require, exports, module) {

  const Events = require('plug/core/Events');
  const ApplicationView = require('plug/views/app/ApplicationView');

  const settings = require('./store/settings');
  const RoomSettings = require('./models/RoomSettings');
  const PluginMeta = require('./models/PluginMeta');
  const PluginsCollection = require('./collections/PluginsCollection');
  const Plugin = require('./Plugin');
  const loadPlugin = require('./load-plugin');

  const VersionPlugin = require('./plugins/version');
  const SettingsTabPlugin = require('./plugins/settings-tab');
  const ChatTypePlugin = require('./plugins/custom-chat-type');
  const ChatClassesPlugin = require('./plugins/chat-classes');

  const _package = require('./package');

  const $ = require('jquery');
  const _ = require('underscore');
  const Backbone = require('backbone');
  const meld = require('meld');
  const semvercmp = require('semver-compare');

  let hooks = [
    require('./hooks/waitlist'),
    require('./hooks/api-early'),
    require('./hooks/chat'),
    require('./hooks/playback'),
    require('./hooks/settings'),
    require('./hooks/popout-style')
  ];

  // LocalStorage key name for extplug
  const LS_NAME = 'extPlugins';

  // Try to parse as JSON, defaulting to an empty object.
  function jsonParse(str) {
    try { return JSON.parse(str) || {}; }
    catch (e) {}
    return {};
  }

  /**
   * Gets a reference to the main Plug.DJ ApplicationView instance.
   *
   * The ApplicationView is not stored anywhere public, it just
   * exists as a variable in a require() closure, where we cannot
   * directly retrieve it.
   * However, it adds some events to the global Events channel on render,
   * one of them being "show:room", so that's where we can find a reference.
   *
   * @return {ApplicationView} The ApplicationView instance of this page.
   */
  function getApplicationView() {
    let evts = Events._events['show:room'];
    // Backbone event handlers have a .ctx property, containing what they will be bound to.
    // And ApplicationView adds a handler that's bound to itself!
    let appView;
    if (evts) {
      appView = _.find(evts, event => event.ctx instanceof ApplicationView);
    }
    return appView && appView.ctx;
  }

  /**
   * Main ExtPlug extension class.
   *
   * This will be instantiated by ExtPlug later, and can then be accessed
   * on `window.ext`.
   *
   * @constructor
   */
  const ExtPlug = Plugin.extend({
    name: 'ExtPlug',
    settings: {
      corsProxy: { type: 'boolean', default: true, label: 'Use CORS proxy' }
    },
    init() {
      this._super('extplug', this);

      this._core = [
        new VersionPlugin('version', this),
        new SettingsTabPlugin('settings-tab', this),
        new ChatTypePlugin('custom-chat-type', this),
        new ChatClassesPlugin('chat-classes', this)
      ];

    },

    /**
     * Register an ExtPlug plugin by require.js module name.
     * This can be anything that is accepted by require.js, including
     * modules using require.js plugins or modules on remote URLs.
     */
    registerPlugin(id, cb) {
      require(
        [ `extplug/load-plugin!${id}` ],
        plugin => {
          let meta = new PluginMeta({
            id: plugin.id,
            name: plugin.name,
            instance: plugin
          });
          this._plugins.add(meta);
          let settings = this._getPluginSettings(plugin.id);
          plugin.settings.set(settings.settings);
          plugin.settings.on('change', () => {
            this._savePluginSettings(plugin.id);
          });
          if (settings.enabled) {
            _.defer(() => {
              meta.enable();
            });
          }
          if (cb) cb(null);
        },
        (err) => {
          if (cb) cb(err);
        }
      );
      return this;
    },

    /**
     * Disables and removes an ExtPlug plugin.
     */
    unregisterPlugin(id) {
      let plugin = this._plugins.findWhere({ id: id });
      if (plugin) {
        plugin.disable();
        this._plugins.remove(plugin);
      }
    },

    getPlugin(id) {
      let meta = this._plugins.get(id);
      return meta ? meta.get('instance') : null;
    },

    /**
     * Installs a plugin. This is basically registerPlugin(), but it also
     * remembers the plugin name so it can be loaded again automatically
     * on following ExtPlug runs.
     */
    install(id, cb) {
      this.registerPlugin(id, (e) => {
        if (e) return cb(e);
        let json = jsonParse(localStorage.getItem(LS_NAME));
        json.installed = (json.installed || []).concat([ id ]);
        localStorage.setItem(LS_NAME, JSON.stringify(json));
        cb(null);
      });
    },

    /**
     * Disables and removes a plugin forever.
     */
    uninstall(id) {
      this.unregisterPlugin(id);
      let json = jsonParse(localStorage.getItem(LS_NAME));
      if (json.installed) {
        let i = json.installed.indexOf(id);
        if (i !== -1) {
          json.installed.splice(i, 1);
          localStorage.setItem(LS_NAME, JSON.stringify(json));
        }
      }
    },

    /**
     * Loads installed plugins.
     */
    _loadInstalled() {
      let { installed } = jsonParse(localStorage.getItem(LS_NAME));
      if (_.isArray(installed)) {
        let l = installed.length;
        let i = 0;
        let errors = [];
        const done = () => {
          if (errors.length) {
            errors.forEach(e => {
              Events.trigger('notify', 'icon-chat-system',
                             `Plugin error: ${e.message}`);
            });
          }
          else if (i > 0) {
            Events.trigger('notify', 'icon-plug-dj',
                           `ExtPlug: loaded ${i} plugins.`);
          }
        };
        installed.forEach(name => {
          this.registerPlugin(name, e => {
            if (e) errors.push(e);
            if (++i >= l) {
              done();
            }
          });
        });
      }
    },

    /**
     * Checks if ExtPlug has been initialised before.
     */
    isFirstRun() {
      return localStorage.getItem(LS_NAME) == null;
    },
    /**
     * Things that should only happen the first time ExtPlug
     * is initialised.
     */
    onFirstRun() {
      localStorage.setItem(LS_NAME, JSON.stringify({
        version: _package.version,
        installed: [
          'autowoot/build/autowoot.js;extplug/autowoot/main',
          'chat-notifications/build/chat-notifications.js;' +
            'extplug/chat-notifications/main',
          'compact-history/build/compact-history.js;' +
            'extplug/compact-history/main',
          'hide-badges/build/hide-badges.js;extplug/hide-badges/main',
          'meh-icons/build/meh-icons.js;extplug/meh-icons/main',
          'room-styles/build/room-styles.js;extplug/room-styles/main',
          'show-deleted/build/show-deleted.js;extplug/show-deleted/main'
        ].map(path => `https://extplug.github.io/${path}`),
        plugins: {}
      }));
    },

    /**
     * Initializes ExtPlug.
     *
     * This attaches events and finds some common DOM elements. Also, adds
     * the ExtPlug tab to the user settings area.
     *
     * @return {ExtPlug} `this`.
     */
    enable() {
      this._super();

      /**
       * Internal map of registered plugins.
       */
      this._plugins = new PluginsCollection();
      this._plugins.on('change:enabled', (plugin, enabled) => {
        this._savePluginSettings(plugin.get('id'));
      });

      if (this.isFirstRun()) this.onFirstRun();

      this.upgrade();

      settings.update();
      this.appView = getApplicationView();

      // install extra events
      hooks.forEach(hook => {
        hook.install();
      });

      this._core.forEach(plugin => {
        plugin.enable();
      });

      // ExtPlug styles
      this.createStyle()
        .set(require('./styles/badge'))
        .set(require('./styles/inline-chat'))
        .set(require('./styles/settings-pane'))
        .set(require('./styles/install-plugin-dialog'));

      // room settings
      this.roomSettings = new RoomSettings(this);

      this._loadInstalled();
      Events.trigger('notify', 'icon-plug-dj', `ExtPlug v${_package.version} loaded`);

      return this;
    },

    /**
     * Deinitializes and cleans up ExtPlug.
     *
     * Everything should be unloaded here, so the Plug.DJ page looks like nothing ever happened.
     */
    disable() {
      this._plugins.off().forEach(mod => {
        mod.disable();
      });
      this._core.forEach(plugin => {
        plugin.disable();
      });
      hooks.forEach(hook => {
        hook.uninstall();
      });

      // remove room settings handling
      this.roomSettings.dispose();
      this.trigger('deinit');
      this._super();
    },

    /**
     * Persists plugin settings to localStorage.
     * @private
     */
    _savePluginSettings(id) {
      let json = jsonParse(localStorage.getItem(LS_NAME));
      let plugin = this._plugins.findWhere({ id: id });
      let settings = plugin.get('instance').settings;
      if (!json.plugins) json.plugins = {};
      json.plugins[id] = { enabled: plugin.get('enabled'), settings: settings };
      localStorage.setItem(LS_NAME, JSON.stringify(json));
    },

    /**
     * Retrieves plugin settings from localStorage.
     */
    _getPluginSettings(id) {
      let settings = jsonParse(localStorage.getItem(LS_NAME)).plugins;
      if (settings && id in settings) {
        return settings[id];
      }
      return { enabled: false, settings: {} };
    },

    /**
     * Upgrades old ExtPlug version settings.
     */
    upgrade() {
      let stored = jsonParse(localStorage.getItem(LS_NAME));

      // "hide-badges" was added in 0.10.0
      if (semvercmp(stored.version, '0.10.0') < 0) {
        stored.version = '0.10.0';
        const plugin = 'extplug/plugins/hide-badges/main';
        if (stored.installed.indexOf(plugin) === -1) {
          stored.installed.push(plugin);
        }
      }

      // "rollover-blurbs" was removed from core in 0.12.0
      if (semvercmp(stored.version, '0.12.0') < 0) {
        stored.version = '0.12.0';
        replace(
          'extplug/plugins/rollover-blurbs/main',
          'https://extplug.github.io/rollover-blurb/build/rollover-blurb.js',
          'extplug/rollover-blurb/main'
        );
      }

      if (semvercmp(stored.version, '0.13.0') < 0) {
        stored.version = '0.13.0';
        replace(
          'extplug/plugins/autowoot/main',
          'https://extplug.github.io/autowoot/build/autowoot.js',
          'extplug/autowoot/main'
        );
        replace(
          'extplug/plugins/chat-notifications/main',
          'https://extplug.github.io/chat-notifications/build/chat-notifications.js',
          'extplug/chat-notifications/main'
        );
        replace(
          'extplug/plugins/compact-history/main',
          'https://extplug.github.io/compact-history/build/compact-history.js',
          'extplug/compact-history/main'
        );
        replace(
          'extplug/plugins/hide-badges/main',
          'https://extplug.github.io/hide-badges/build/hide-badges.js',
          'extplug/hide-badges/main'
        );
        replace(
          'extplug/plugins/meh-icon/main',
          'https://extplug.github.io/meh-icons/build/meh-icons.js;' +
          'extplug/meh-icons/main'
        );
        replace(
          'extplug/plugins/room-styles/main',
          'https://extplug.github.io/room-styles/build/room-styles.js',
          'extplug/room-styles/main'
        );

        // full-size video was removed in favour of plug's Video Only mode
        let fullSizeVideo = 'extplug/plugins/full-size-video/main';
        stored.installed = _.without(stored.installed, fullSizeVideo);
        delete stored.plugins[fullSizeVideo];
      }
      if (semvercmp(stored.version, '0.13.1') < 0) {
        stored.version = '0.13.1';
        // show-deleted was added to core in 0.13
        let showDeleted =
            'https://extplug.github.io/show-deleted/build/show-deleted.js;' +
            'extplug/show-deleted/main';
        if (stored.installed.indexOf(showDeleted) === -1) {
          stored.installed.push(showDeleted);
        }
      }

      localStorage.setItem(LS_NAME, JSON.stringify(stored));

      function replace(oldPlugin, url, name) {
        let i = stored.installed.indexOf(oldPlugin);
        if (i !== -1) {
          stored.installed.splice(i, 1, `${url};${name}`);
          // move settings
          stored.plugins[name] = stored.plugins[oldPlugin];
          delete stored.plugins[oldPlugin];
        }
      }
    }
  });

  module.exports = ExtPlug;

});
