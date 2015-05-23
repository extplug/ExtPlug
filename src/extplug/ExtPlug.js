define(function (require, exports, module) {

  const currentMedia = require('plug/models/currentMedia');
  const currentRoom = require('plug/models/currentRoom');
  const settings = require('extplug/store/settings');
  const Events = require('plug/core/Events');
  const ApplicationView = require('plug/views/app/ApplicationView');
  const UserView = require('plug/views/users/UserView');
  const ChatView = require('plug/views/rooms/chat/ChatView');
  const plugUtil = require('plug/util/util');
  const emoji = require('plug/util/emoji');

  const RoomSettings = require('extplug/models/RoomSettings');
  const PluginMeta = require('extplug/models/PluginMeta');
  const PluginsCollection = require('extplug/collections/PluginsCollection');
  const Plugin = require('extplug/Plugin');
  const chatFacade = require('extplug/facades/chatFacade');
  const loadPlugin = require('extplug/load-plugin');

  const VersionPlugin = require('./plugins/version');
  const SettingsTabPlugin = require('./plugins/settings-tab');
  const ChatTypePlugin = require('./plugins/custom-chat-type');

  const _package = require('extplug/package');

  const $ = require('jquery');
  const _ = require('underscore');
  const Backbone = require('backbone');
  const meld = require('meld');

  let hooks = [
    require('extplug/hooks/api-early'),
    require('extplug/hooks/chat'),
    require('extplug/hooks/playback'),
    require('extplug/hooks/settings')
  ];

  // LocalStorage key name for extplug
  const LS_NAME = 'extPlugins';

  // Try to parse as JSON, defaulting to an empty object.
  function jsonParse(str) {
    try { return JSON.parse(str) || {}; }
    catch (e) {}
    return {};
  }

  // compare semver version numbers
  function semvercmp(a, b) {
    a = a.split('.').map(n => parseInt(n, 10));
    b = b.split('.').map(n => parseInt(n, 10));
    for (let i = 0; i < 3; i++) {
      if (a[i] > b[i]) return 1;
      if (a[i] < b[i]) return -1;
    }
    return 0;
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

      /**
       * Internal map of registered plugins.
       */
      this._plugins = new PluginsCollection();
      this._plugins.on('change:enabled', (plugin, enabled) => {
        this._savePluginSettings(plugin.get('id'));
      });

      this._core = [
        new VersionPlugin('version', this),
        new SettingsTabPlugin('settings-tab', this),
        new ChatTypePlugin('custom-chat-type', this)
      ];

    },

    registerModule(id, cb) {
      console.warn('ExtPlug#registerModule is deprecated. Use #registerPlugin instead.');
      return this.registerPlugin(id, cb);
    },

    /**
     * Register an ExtPlug plugin by require.js module name.
     * This can be anything that is accepted by require.js, including
     * modules using require.js plugins or modules on remote URLs.
     */
    registerPlugin(id, cb) {
      require(
        [ `extplug/load-plugin!${id}` ],
        (Plugin) => {
          let plugin = new Plugin(id, this);
          let meta = new PluginMeta({
            id: id,
            name: plugin.name,
            instance: plugin
          });
          this._plugins.add(meta);
          let settings = this._getPluginSettings(plugin.id);
          plugin.settings.set(settings.settings);
          plugin.settings.on('change', () => {
            this._savePluginSettings(id);
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

    unregisterModule(id) {
      console.warn('ExtPlug#unregisterModule is deprecated. Use #unregisterPlugin instead.');
      return this.unregisterPlugin(id);
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
          'extplug/plugins/autowoot/main',
          'extplug/plugins/chat-notifications/main',
          'extplug/plugins/compact-history/main',
          'extplug/plugins/full-size-video/main',
          'extplug/plugins/meh-icon/main',
          'extplug/plugins/rollover-blurbs/main',
          'extplug/plugins/room-styles/main',
          'extplug/plugins/hide-badges/main'
        ],
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
      var ext = this;

      if (this.isFirstRun()) this.onFirstRun();

      this.upgrade();

      settings.update();
      this.appView = getApplicationView();

      // ExtPlug styles
      this.Style()
        .set(require('./styles/badge'))
        .set(require('./styles/inline-chat'))
        .set(require('./styles/settings-pane'))
        .set(require('./styles/install-plugin-dialog'));

      // install extra events
      hooks.forEach(hook => {
        hook.install();
      });

      this._core.forEach(plugin => {
        plugin.enable();
      });

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
      this._plugins.forEach(mod => {
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

      localStorage.setItem(LS_NAME, JSON.stringify(stored));
    }
  });

  module.exports = ExtPlug;

});
