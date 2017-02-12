import Events from 'plug/core/Events';
import currentUser from 'plug/models/currentUser';

import RoomSettings from './models/RoomSettings';
import Plugin from './Plugin';
import PluginManager from './PluginManager';
import PluginLocalStorage from './PluginLocalStorage';
import getApplicationView from './util/getApplicationView';
import handlers from './handlers';

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
import UserMenuPlugin from './plugins/UserMenuPlugin';

import * as packageMeta from '../package.json';

import style from './styles/index.css';

// Enable compatibility with AMD-based plugins.
import './util/compatibility';

// LocalStorage key name for extplug
const LS_NAME = 'extPlugins';

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

  style,

  init() {
    this._super('extplug', this);

    this.isFirstRun = localStorage.getItem(LS_NAME) == null;

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
      new UserMenuPlugin('extplug:user-menu', this),
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
      Events.trigger('notify', 'icon-extplug', 'ExtPlug: loaded plugins.', () => {
        Events.trigger('show:user', 'settings', 'ext-plug');
      });
    }).catch((err) => {
      Events.trigger('notify', 'icon-chat-system', `Plugin error: ${err.message}`);
    });
  },

  /**
   * Things that should only happen the first time ExtPlug
   * is initialised.
   */
  onFirstRun() {
    return Promise.all([
      this.manager.install('https://unpkg.com/extplug-autowoot'),
      this.manager.install('https://unpkg.com/extplug-chat-notifications'),
      this.manager.install('https://unpkg.com/extplug-hide-badges'),
      this.manager.install('https://unpkg.com/extplug-meh-icons'),
      this.manager.install('https://unpkg.com/extplug-room-styles'),
      this.manager.install('https://unpkg.com/extplug-show-deleted'),
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

    if (this.isFirstRun) this.onFirstRun();

    this.upgrade();

    this.appView = getApplicationView();

    this.unsubscribeHandlers = handlers(this);

    this.corePlugins.forEach((plugin) => {
      plugin.enable();
    });

    // room settings
    this.roomSettings = new RoomSettings(this);

    this.loadInstalledPlugins();
    Events.trigger('notify', 'icon-extplug', `ExtPlug v${packageMeta.version} loaded`);

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

    this.unsubscribeHandlers();
    this.unsubscribeHandlers = null;

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
