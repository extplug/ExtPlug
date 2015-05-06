define(function (require, exports, module) {

  const currentMedia = require('plug/models/currentMedia');
  const currentRoom = require('plug/models/currentRoom');
  const settings = require('extplug/store/settings');
  const Events = require('plug/core/Events');
  const ApplicationView = require('plug/views/app/ApplicationView');
  const UserView = require('plug/views/users/UserView');
  const UserSettingsView = require('plug/views/users/settings/SettingsView');
  const ChatView = require('plug/views/rooms/chat/ChatView');
  const plugUtil = require('plug/util/util');
  const emoji = require('plug/util/emoji');

  const RoomSettings = require('extplug/models/RoomSettings');
  const PluginMeta = require('extplug/models/PluginMeta');
  const PluginsCollection = require('extplug/collections/PluginsCollection');
  const ExtUserView = require('extplug/views/users/ExtUserView');
  const ExtSettingsSectionView = require('extplug/views/users/settings/SettingsView');
  const ExtSettingsTabMenuView = require('extplug/views/users/settings/TabMenuView');
  const Plugin = require('extplug/Plugin');
  const chatFacade = require('extplug/facades/chatFacade');
  const loadPlugin = require('extplug/load-plugin');

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
      appView = _.find(evts, event => event.ctx instanceof ApplicationView)
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
        json._installed = (json._installed || []).concat([ id ])
        localStorage.setItem(LS_NAME, JSON.stringify(json));
        cb(null)
      });
    },

    /**
     * Disables and removes a plugin forever.
     */
    uninstall(id) {
      this.unregisterPlugin(id);
      let json = jsonParse(localStorage.getItem(LS_NAME));
      if (json._installed) {
        let i = json._installed.indexOf(id);
        if (i !== -1) {
          json._installed.splice(i, 1);
          localStorage.setItem(LS_NAME, JSON.stringify(json));
        }
      }
    },

    /**
     * Loads installed plugins.
     */
    _loadInstalled() {
      let { _installed } = jsonParse(localStorage.getItem(LS_NAME));
      if (_.isArray(_installed)) {
        let l = _installed.length;
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
        _installed.forEach(name => {
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

      settings.update();
      this.appView = getApplicationView();

      // ExtPlug styles
      this.Style({
        // EXT logo
        '#app-menu .button i:after': {
          content: '"EXT"',
          color: '#fff',
          background: '#f00',
          'z-index': 10,
          'font-size': '70%',
          'border-radius': '10px',
          padding: '1px 4px',
          'margin-top': '5px',
          position: 'relative',
          float: 'right'
        },
        // inline chat messages
        '#chat-messages .cm.inline': {
          '.badge-box': {
            'margin': '5px 8px 6px',
            'height': '16px',
            'border-radius': '0px',
            'background': 'transparent',

            // center badge icons
            '.icon': {
              'top': '50%',
              'margin-top': '-15px'
            }
          },
          '.from': { 'display': 'inline' },
          '.text': { 'display': 'inline', 'margin-left': '5px' }
        },
        '#chat-messages .cm .no-badge .icon': {
          'width': '30px',
          'height': '30px',
          'top': '0px',
          'left': '0px',
          'border': 'none',
          'border-radius': '0px'
        }
      });

      const pad = x => x < 10 ? `0${x}` : x
      let ba = new Date(_package.builtAt)
      let builtAt = ba.getUTCFullYear() + '-'
                  + pad(ba.getUTCMonth()   + 1) + '-'
                  + pad(ba.getUTCDate()    + 1) + ' '
                  + pad(ba.getUTCHours()   + 1) + ':'
                  + pad(ba.getUTCMinutes() + 1) + ':'
                  + pad(ba.getUTCSeconds() + 1) + ' UTC'
      chatFacade.registerCommand('version', () => {
        API.chatLog(`${_package.name} v${_package.version} (${builtAt})`);
      });

      // replace rendered UserView
      var userView = new ExtUserView();
      userView.render();
      this.appView.user.$el.replaceWith(userView.$el);
      this.appView.user = userView;

      // Add ExtPlug tab to user settings
      this._settingsTabAdvice = meld.around(UserSettingsView.prototype, 'getMenu', () => {
        return new ExtSettingsTabMenuView();
      });
      this._settingsPaneAdvice = meld.around(UserSettingsView.prototype, 'getView', joinpoint => {
        if (joinpoint.args[0] === 'ext-plug') {
          return new ExtSettingsSectionView({
            plugins: ext._plugins,
            ext: ext
          });
        }
        return joinpoint.proceed();
      });

      // install extra events
      hooks.forEach(hook => {
        hook.install();
      });

      // add custom chat message type
      function addCustomChatType(joinpoint) {
        var message = joinpoint.args[0];
        if (message.type.split(' ').indexOf('custom') !== -1) {
          message.type += ' update';
          if (!message.timestamp) {
            message.timestamp = plugUtil.getChatTimestamp();
          }
          joinpoint.proceed();
          if (message.badge) {
            if (/^:(.*?):$/.test(message.badge)) {
              var badgeBox = this.$chatMessages.children().last().find('.badge-box'),
                emojiName = message.badge.slice(1, -1);
              if (emoji.map[emojiName]) {
                badgeBox.find('i').remove();
                badgeBox.append(
                  $('<span />').addClass('emoji-glow extplug-badji').append(
                    $('<span />').addClass('emoji emoji-' + emoji.map[emojiName])
                  )
                );
              }
            }
            else if (/^icon-(.*?)$/.test(message.badge)) {
              var badgeBox = this.$chatMessages.children().last().find('.badge-box')
              badgeBox.find('i')
                .removeClass()
                .addClass('icon').addClass(message.badge);
            }
          }
          if (message.color) {
            this.$chatMessages.children().last().find('.msg .text').css('color', message.color);
          }
        }
        else {
          joinpoint.proceed(message);
        }
      }

      // Replace the event listener too
      var chatView = this.appView.room.chat;
      if (chatView) {
        Events.off('chat:receive', chatView.onReceived);
      }
      this._chatTypeAdvice = meld.around(ChatView.prototype, 'onReceived', addCustomChatType);
      if (chatView) {
        Events.on('chat:receive', chatView.onReceived, chatView);
      }

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
      hooks.forEach(hook => {
        hook.uninstall();
      });
      // remove settings pane
      this._settingsTabAdvice.remove();
      this._settingsPaneAdvice.remove();
      var userView = new UserView();
      userView.render();
      this.appView.user.$el.replaceWith(userView.$el);
      this.appView.user = userView;
      // remove custom chat type advice, and restore
      // the original event listener
      let chatView = this.appView.room.chat;
      if (chatView) Events.off('chat:receive', chatView.onReceived);
      this._chatTypeAdvice.remove();
      if (chatView) Events.on('chat:receive', chatView.onReceived, chatView);

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
      json[id] = { enabled: plugin.get('enabled'), settings: settings };
      localStorage.setItem(LS_NAME, JSON.stringify(json));
    },

    /**
     * Retrieves plugin settings from localStorage.
     */
    _getPluginSettings(id) {
      let settings = jsonParse(localStorage.getItem(LS_NAME));
      if (settings && id in settings) {
        return settings[id];
      }
      return { enabled: false, settings: {} };
    },

    /**
     * 3rd party plugins should use `extp.push` to register callbacks or modules
     * for when ExtPlug is loaded.
     * This ensures that plugins that are loaded *after* ExtPlug will also register.
     *
     * @param {function()} cb
     */
    push(cb) {
      if (typeof cb === 'string') {
        this.registerPlugin(cb);
      }
      else {
        _.defer(() => {
          cb(this);
        });
      }
    }
  });

  module.exports = ExtPlug;

});
