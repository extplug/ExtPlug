import { each, find } from 'underscore';

import Events from 'plug/core/Events';
import ApplicationView from 'plug/views/app/ApplicationView';
import currentUser from 'plug/models/currentUser';

import RoomSettings from './models/RoomSettings';
import Plugin from './Plugin';
import PluginManager from './PluginManager';
import PluginLocalStorage from './PluginLocalStorage';

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
    this.manager = new PluginManager({
      storage: new PluginLocalStorage({ version: packageMeta.version }),
    });

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
    this.manager.load(id).then(
      result => cb(null, result),
      err => cb(err),
    );
  },

  /**
   * Disables and removes an ExtPlug plugin.
   */
  unregisterPlugin(id) {
    this.manager.unload(id);
  },

  getPlugin(id) {
    return this.manager.getPlugin(id);
  },

  /**
   * Installs a plugin. This is basically registerPlugin(), but it also
   * remembers the plugin name so it can be loaded again automatically
   * on following ExtPlug runs.
   */
  install(id, cb) {
    this.manager.install(id).then(
      result => cb(null, result),
      err => cb(err),
    );
  },

  /**
   * Disables and removes a plugin forever.
   */
  uninstall(id) {
    this.manager.uninstall(id);
  },

  /**
   * Loads installed plugins.
   */
  loadInstalledPlugins() {
    this.manager.loadInstalledPlugins().then(() => {
      Events.trigger('notify', 'icon-plug-dj', 'ExtPlug: loaded plugins.');
    }).catch((err) => {
      Events.trigger('notify', 'icon-chat-system', `Plugin error: ${err.message}`);
    });
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
    return Promise.all([
      this.manager.install('https://extplug.github.io/autowoot/build/autowoot.js;extplug/autowoot/main'),
      this.manager.install('https://extplug.github.io/chat-notifications/build/chat-notifications.js;extplug/chat-notifications/main'),
      this.manager.install('https://extplug.github.io/hide-badges/build/hide-badges.js;extplug/hide-badges/main'),
      this.manager.install('https://extplug.github.io/meh-icons/build/meh-icons.js;extplug/meh-icons/main'),
      this.manager.install('https://extplug.github.io/room-styles/build/room-styles.js;extplug/room-styles/main'),
      this.manager.install('https://extplug.github.io/show-deleted/build/show-deleted.js;extplug/show-deleted/main'),
    ]);
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
     *
     * TODO Remove this property and add replacement methods and events to
     * PluginManager.
     */
    Object.defineProperty(this, 'plugins', {
      get: () => this.manager.pluginInstances,
    });

    if (this.isFirstRun()) this.onFirstRun();

    this.upgrade();

    this.appView = getApplicationView();

    this.corePlugins.forEach((plugin) => {
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
    this.manager.unloadAll();

    this.corePlugins.forEach((plugin) => {
      plugin.disable();
    });

    this.guestPlugin.disable();

    // remove room settings handling
    this.roomSettings.dispose();
    this.trigger('deinit');
    this._super();
  },

  /**
   * Upgrades old ExtPlug version settings.
   */
  upgrade() {
    // Empty
  },
});

export default ExtPlug;
