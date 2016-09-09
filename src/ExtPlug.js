import { defer, each, find, isArray } from 'underscore';

import Events from 'plug/core/Events';
import ApplicationView from 'plug/views/app/ApplicationView';
import currentUser from 'plug/models/currentUser';

import RoomSettings from './models/RoomSettings';
import PluginsCollection from './collections/PluginsCollection';
import Plugin from './Plugin';
import * as pluginLoader from './pluginLoader';

import EarlyAPIEventsPlugin from './plugins/EarlyAPIEventsPlugin';
import CommandsPlugin from './plugins/CommandsPlugin';
import SettingsTabPlugin from './plugins/SettingsTabPlugin';
import ChatTypePlugin from './plugins/ChatTypePlugin';
import MoreChatEventsPlugin from './plugins/MoreChatEventsPlugin';
import UserClassesPlugin from './plugins/UserClassesPlugin';
import EmojiDataPlugin from './plugins/EmojiDataPlugin';
import TooltipsPlugin from './plugins/TooltipsPlugin';
import GuestPlugin from './plugins/GuestPlugin';
import SocketEventsPlugin from './plugins/SocketEventsPlugin';
import WaitlistEventsPlugin from './plugins/WaitlistEventsPlugin';
import PlaybackEventsPlugin from './plugins/PlaybackEventsPlugin';
import PlugSettingsPlugin from './plugins/PlugSettingsPlugin';
import PopoutStylePlugin from './plugins/PopoutStylePlugin';

import * as packageMeta from '../package.json';

import * as style from './styles';

// Enable compatibility with AMD-based plugins.
import './util/compatibility';

// LocalStorage key name for extplug
const LS_NAME = 'extPlugins';

// Try to parse as JSON, defaulting to an empty object.
function jsonParse(str) {
  try {
    return JSON.parse(str) || {};
  } catch (e) {
    return {};
  }
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
  const evts = Events._events['show:room']; // eslint-disable-line no-underscore-dangle
  // Backbone event handlers have a .ctx property, containing what they will be bound to.
  // And ApplicationView adds a handler that's bound to itself!
  let appView;
  if (evts) {
    appView = find(evts, event => event.ctx instanceof ApplicationView);
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
    corsProxy: {
      type: 'boolean',
      default: true,
      label: 'Use CORS proxy',
    },
  },

  init() {
    this._super('extplug', this);

    this.corePlugins = [
      new EarlyAPIEventsPlugin('extplug:early-api', this),
      new CommandsPlugin('extplug:chat-commands', this),
      new SettingsTabPlugin('extplug:settings-tab', this),
      new MoreChatEventsPlugin('extplug:more-chat-events', this),
      new ChatTypePlugin('extplug:custom-chat-type', this),
      new UserClassesPlugin('extplug:user-classes', this),
      new EmojiDataPlugin('extplug:emoji-data', this),
      new TooltipsPlugin('extplug:tooltips', this),
      new SocketEventsPlugin('extplug:socket-events', this),
      new WaitlistEventsPlugin('extplug:waitlist-events', this),
      new PlaybackEventsPlugin('extplug:playback-events', this),
      new PlugSettingsPlugin('extplug:plug-settings', this),
      new PopoutStylePlugin('extplug:popout-style', this),
    ];

    this.guestPlugin = new GuestPlugin('extplug:guest', this);

    // Alias for compatibility with old versions.
    Object.defineProperty(this, '_plugins', {
      get() {
        return this.plugins;
      },
    });
  },

  /**
   * Register an ExtPlug plugin by require.js module name.
   * This can be anything that is accepted by require.js, including
   * modules using require.js plugins or modules on remote URLs.
   */
  registerPlugin(id, cb) {
    pluginLoader.load(id, (e, meta) => {
      if (e) {
        if (cb) cb(e);
        return;
      }

      this.plugins.add(meta);
      const instance = meta.get('instance');
      const state = this.getPluginSettings(meta.get('id'));
      instance.settings.set(state.settings);
      instance.settings.on('change', () => {
        this.savePluginSettings(meta.get('id'));
      });
      if (state.enabled) {
        defer(() => meta.enable());
      }
      if (cb) {
        cb(null);
      }
    });
    return this;
  },

  /**
   * Disables and removes an ExtPlug plugin.
   */
  unregisterPlugin(id) {
    const plugin = this.plugins.findWhere({ id });
    if (plugin) {
      plugin.disable();
      this.plugins.remove(plugin);
    }
  },

  getPlugin(id) {
    const meta = this.plugins.get(id);
    return meta ? meta.get('instance') : null;
  },

  /**
   * Installs a plugin. This is basically registerPlugin(), but it also
   * remembers the plugin name so it can be loaded again automatically
   * on following ExtPlug runs.
   */
  install(id, cb) {
    this.registerPlugin(id, (e) => {
      if (e) {
        cb(e);
        return;
      }
      const json = jsonParse(localStorage.getItem(LS_NAME));
      json.installed = (json.installed || []).concat([id]);
      localStorage.setItem(LS_NAME, JSON.stringify(json));
      cb(null);
    });
  },

  /**
   * Disables and removes a plugin forever.
   */
  uninstall(id) {
    this.unregisterPlugin(id);
    const json = jsonParse(localStorage.getItem(LS_NAME));
    if (json.installed) {
      const i = json.installed.indexOf(id);
      if (i !== -1) {
        json.installed.splice(i, 1);
        localStorage.setItem(LS_NAME, JSON.stringify(json));
      }
    }
  },

  /**
   * Loads installed plugins.
   */
  loadInstalledPlugins() {
    const { installed } = jsonParse(localStorage.getItem(LS_NAME));
    if (isArray(installed)) {
      const l = installed.length;
      let i = 0;
      const errors = [];
      const done = () => {
        if (errors.length) {
          errors.forEach(e => {
            Events.trigger('notify', 'icon-chat-system',
                           `Plugin error: ${e.message}`);
          });
        } else if (i > 0) {
          Events.trigger('notify', 'icon-plug-dj',
                         `ExtPlug: loaded ${i} plugins.`);
        }
      };
      installed.forEach(name => {
        this.registerPlugin(name, e => {
          if (e) errors.push(e);
          i += 1;
          if (i >= l) {
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
      version: packageMeta.version,
      installed: [
        'autowoot/build/autowoot.js;extplug/autowoot/main',
        'chat-notifications/build/chat-notifications.js;' +
          'extplug/chat-notifications/main',
        'compact-history/build/compact-history.js;' +
          'extplug/compact-history/main',
        'hide-badges/build/hide-badges.js;extplug/hide-badges/main',
        'meh-icons/build/meh-icons.js;extplug/meh-icons/main',
        'room-styles/build/room-styles.js;extplug/room-styles/main',
        'show-deleted/build/show-deleted.js;extplug/show-deleted/main',
      ].map(path => `https://extplug.github.io/${path}`),
      plugins: {},
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
    API.enabled = true;

    /**
     * Internal map of registered plugins.
     */
    this.plugins = new PluginsCollection();
    this.plugins.on('change:enabled', plugin => {
      this.savePluginSettings(plugin.get('id'));
    });

    if (this.isFirstRun()) this.onFirstRun();

    this.upgrade();

    this.appView = getApplicationView();

    this.corePlugins.forEach(plugin => {
      plugin.enable();
    });

    each(style, c => this.createStyle(c));

    // room settings
    this.roomSettings = new RoomSettings(this);

    this.loadInstalledPlugins();
    Events.trigger('notify', 'icon-plug-dj', `ExtPlug v${packageMeta.version} loaded`);

    if (currentUser.get('guest')) {
      this.guestPlugin.enable();
      currentUser.once('change:guest', () => {
        this.guestPlugin.disable();
      });
    }

    return this;
  },

  /**
   * Deinitializes and cleans up ExtPlug.
   *
   * Everything should be unloaded here, so the Plug.DJ page looks like nothing ever happened.
   */
  disable() {
    this.plugins.off().forEach(mod => {
      mod.disable();
    });
    this.corePlugins.forEach(plugin => {
      plugin.disable();
    });

    this.guestPlugin.disable();

    // remove room settings handling
    this.roomSettings.dispose();
    this.trigger('deinit');
    this._super();
  },

  /**
   * Persists plugin settings to localStorage.
   * @private
   */
  savePluginSettings(id) {
    const json = jsonParse(localStorage.getItem(LS_NAME));
    const plugin = this.plugins.findWhere({ id });
    const settings = plugin.get('instance').settings;

    if (!json.plugins) {
      json.plugins = {};
    }

    json.plugins[id] = {
      enabled: plugin.get('enabled'),
      settings,
    };

    localStorage.setItem(LS_NAME, JSON.stringify(json));
  },

  /**
   * Retrieves plugin settings from localStorage.
   */
  getPluginSettings(id) {
    const settings = jsonParse(localStorage.getItem(LS_NAME)).plugins;
    if (settings && id in settings) {
      return settings[id];
    }
    return { enabled: false, settings: {} };
  },

  /**
   * Upgrades old ExtPlug version settings.
   */
  upgrade() {
    // Empty
  },
});

export default ExtPlug;
