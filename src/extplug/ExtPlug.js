define(function (require, exports, module) {

  var currentMedia = require('plug/models/currentMedia'),
    currentRoom = require('plug/models/currentRoom'),
    settings = require('extplug/store/settings'),
    Events = require('plug/core/Events'),
    ApplicationView = require('plug/views/app/ApplicationView'),
    SettingsTabMenuView = require('plug/views/users/settings/TabMenuView'),
    AppSettingsSectionView = require('plug/views/users/settings/SettingsApplicationView'),
    UserView = require('plug/views/users/UserView'),
    UserSettingsView = require('plug/views/users/settings/SettingsView'),
    ChatView = require('plug/views/rooms/chat/ChatView'),
    plugUtil = require('plug/util/util'),
    emoji = require('plug/util/emoji'),

    Settings = require('extplug/models/Settings'),
    RoomSettings = require('extplug/models/RoomSettings'),
    Module = require('extplug/models/Module'),
    ModulesCollection = require('extplug/collections/ModulesCollection'),
    ExtUserView = require('extplug/views/users/ExtUserView'),
    ExtSettingsSectionView = require('extplug/views/users/settings/SettingsView'),
    ExtSettingsTabMenuView = require('extplug/views/users/settings/TabMenuView'),
    Style = require('extplug/util/Style'),
    fnUtils = require('extplug/util/function'),
    _Module = require('extplug/Module'),

    $ = require('jquery'),
    _ = require('underscore'),
    Backbone = require('backbone'),
    meld = require('meld');

  var hooks = [
    require('extplug/hooks/api-early'),
    require('extplug/hooks/chat'),
    require('extplug/hooks/playback')
  ];

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
    var evts = Events._events['show:room'];
    // Backbone event handlers have a .ctx property, containing what they will be bound to.
    // And ApplicationView adds a handler that's bound to itself!
    var appView
    if (evts) {
      appView = _.find(evts, function (event) { return event.ctx instanceof ApplicationView; })
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
  function ExtPlug() {
    _.extend(this, Backbone.Events);

    /**
     * Internal map of registered modules.
     * @type {Object.<string, Module>}
     */
    this._modules = new ModulesCollection();

    /**
     * ExtPlug settings.
     *
     * @type {Settings}
     */
    this.settings = new Settings({ corsProxy: true });
    /**
     * jQuery Document object.
     * @type {jQuery|null}
     */
    this.document = null;

    // bound methods
    this.onClick = this.onClick.bind(this);
    this.onVolume = this.onVolume.bind(this);
    this.onJoinedChange = this.onJoinedChange.bind(this);
  }

  /**
   * Enables a module.
   *
   * @param {string} name Module name.
   */
  ExtPlug.prototype.enable = function (name) {
    var mod = this._modules.findWhere({ name: name });
    if (mod && !mod.get('enabled')) {
      mod.get('module').enable();
      mod.set('enabled', true);
      this._updateEnabledModules();
    }
  };

  /**
   * Disables a module.
   *
   * @param {string} name Module name.
   */
  ExtPlug.prototype.disable = function (name) {
    var mod = this._modules.findWhere({ name: name });
    if (mod && mod.get('enabled')) {
      mod.get('module').disable();
      mod.set('enabled', false);
      this._updateEnabledModules();
    }
  };

  /**
   * Checks if a module is enabled.
   *
   * @param {string} name Module name.
   *
   * @return {boolean} True if the Module is enabled, false otherwise.
   */
  ExtPlug.prototype.enabled = function (name) {
    var mod = this._modules.findWhere({ name: name });
    return mod ? mod.get('enabled') : false;
  };

  /**
   * Registers a new module.
   *
   * @param {function()} Mod A module constructor created with {@link Module}.
   *
   * @return {ExtPlug} `this`.
   * @deprecated Use registerModule() instead. It integrates better with plug.dj's
   *             require.js-based app, and properly takes care of dependencies.
   */
  ExtPlug.prototype.register = function (id, Mod) {
    if (Mod) {
      try {
        var mod = new Mod(id, this);
        this._modules.add(new Module({ module: mod, name: mod.name }));
      }
      catch (e) {
        this._modules.add(new Module({ module: e, name: mod && mod.name || mod.prototype.name }));
      }
    }
    return this;
  };

  /**
   * Register an ExtPlug module by require.js module name.
   * This can be anything that is accepted by require.js, including
   * modules using require.js plugins or modules on remote URLs.
   */
  ExtPlug.prototype.registerModule = function (id) {
    require([ id ], function (Mod) {
      this.register(id, Mod);
    }.bind(this));
    return this;
  };

  /**
   * Initializes ExtPlug.
   *
   * This attaches events and finds some common DOM elements. Also, adds
   * the ExtPlug tab to the user settings area.
   *
   * @return {ExtPlug} `this`.
   */
  ExtPlug.prototype.init = function () {
    var ext = this;

    settings.update();
    this.appView = getApplicationView();

    this.document = $(document);

    this.logo = new Style({
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
      }
    });

    this.document.on('click.extplug', this.onClick);

    currentMedia.on('change:volume', this.onVolume);

    // add an ExtPlug settings tab to User Settings
    fnUtils.replaceClass(SettingsTabMenuView, ExtSettingsTabMenuView);
    fnUtils.replaceClass(UserView, ExtUserView);
    // replace rendered UserView
    var userView = new UserView();
    userView.render();
    this.appView.user.$el.replaceWith(userView.$el);
    this.appView.user = userView;

    // add the ExtPlug settings pane
    function addExtPlugSettingsPane(joinpoint) {
      if (joinpoint.args[0] === 'ext-plug') {
        return new ExtSettingsSectionView({ modules: ext._modules, ext: ext });
      }
      return joinpoint.proceed();
    }

    var settingsPaneAdvice = meld.around(UserSettingsView.prototype, 'getView', addExtPlugSettingsPane);
    this.on('deinit', function () { settingsPaneAdvice.remove() });

    // install extra events
    hooks.forEach(function (hook) {
      hook.install();
      this.on('deinit', hook.uninstall);
    }, this);

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

    new Style({
      '#chat-messages .cm.inline': {
        '.badge-box': {
          'margin': '5px 8px 6px',
          'height': '17px',
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

    // Replace the event listener too
    var chatView = this.appView.room.chat;
    if (chatView) {
      Events.off('chat:receive', chatView.onReceived);
    }
    var chatTypeAdvice = meld.around(ChatView.prototype, 'onReceived', addCustomChatType);
    this.on('deinit', function () { chatTypeAdvice.remove(); });
    if (chatView) {
      Events.on('chat:receive', chatView.onReceived, chatView);
    }

    // room settings
    var roomSettings = new RoomSettings(this);
    this.roomSettings = roomSettings;
    this.on('deinit', function () {
      roomSettings.dispose();
    });

    currentRoom.on('change:joined', this.onJoinedChange);

    this._loadEnabledModules();

    Events.trigger('notify', 'icon-plug-dj', 'ExtPlug loaded');

    return this;
  };

  /**
   * Deinitializes and cleans up ExtPlug.
   *
   * Everything should be unloaded here, so the Plug.DJ page is like nothing ever happened.
   */
  ExtPlug.prototype.deinit = function () {
    _.each(this._enabled, function (name) {
      this.disable(name);
    }, this);
    this.trigger('deinit');
  };

  /**
   * Persists enabled modules to localStorage.
   * @private
   */
  ExtPlug.prototype._updateEnabledModules = function () {
    var modules = {};
    this._modules.forEach(function (m) {
      modules[m.get('name')] = {
        enabled: m.get('enabled'),
        settings: m.get('module').settings
      };
    }, this);
    localStorage.setItem('extPlugModules', JSON.stringify(modules));
  };

  /**
   * Enables modules and loads their settings from localStorage.
   * @private
   */
  ExtPlug.prototype._loadEnabledModules = function () {
    var enabled = localStorage.getItem('extPlugModules');
    if (enabled) {
      var modules = JSON.parse(enabled);
      _.each(modules, function (m, name) {
        if (m.enabled) {
          this.enable(name);
        }
        var mod = this._modules.findWhere({ name: name });
        if (mod) {
          mod.get('module').settings.set(m.settings);
        }
      }, this);
    }
  };

  /**
   * Full-page onclick handler.
   *
   * @param {MouseEvent} e Event.
   *
   * @private
   */
  ExtPlug.prototype.onClick = function (e) {
    var target = $(e.target);
    if (target.parents('#user-settings').length === 1) {
      settings.update();
    }
  };

  /**
   * Volume change handler.
   *
   * @private
   */
  ExtPlug.prototype.onVolume = function () {
    var newVolume = API.getVolume();
    if (settings.get('volume') !== newVolume) {
      settings.set('volume', newVolume);
    }
  };

  /**
   * Room join/leave handler.
   *
   * @private
   */
  ExtPlug.prototype.onJoinedChange = function () {
    if (currentRoom.get('joined')) {
      this.trigger('room:joined', currentRoom);
    }
    else {
      this.trigger('room:left', currentRoom);
    }
  };

  /**
   * 3rd party modules should use `extp.push` to register callbacks or modules
   * for when ExtPlug is loaded.
   * This ensures that modules that are loaded *after* ExtPlug will also register.
   *
   * @param {function()} cb
   */
  ExtPlug.prototype.push = function (cb) {
    if (typeof cb === 'string') {
      this.registerModule(cb);
    }
    else {
      cb(this);
    }
  };

  module.exports = ExtPlug;

});
