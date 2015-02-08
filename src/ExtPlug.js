define('extplug/ExtPlug', function (require, exports, module) {

  var currentMedia = require('plug/models/currentMedia'),
    currentUser = require('plug/models/currentUser'),
    currentRoom = require('plug/models/currentRoom'),
    settings = require('plug/settings/settings'),
    Events = require('plug/core/Events'),
    ApplicationView = require('plug/views/app/ApplicationView'),
    SettingsTabMenuView = require('plug/views/user/settings/TabMenuView'),
    AppSettingsSectionView = require('plug/views/user/settings/SettingsApplicationView'),
    UserSettingsView = require('plug/views/user/settings/SettingsView'),
    ShowDialogEvent = require('plug/events/ShowDialogEvent'),
    ChatView = require('plug/views/rooms/chat/ChatView'),
    plugUtil = require('plug/util/util'),
    emoji = require('plug/util/emoji'),
    lang = require('plug/lang/Lang'),

    Settings = require('extplug/models/Settings'),
    ExtSettingsSectionView = require('extplug/settings/SettingsView'),
    SettingsGroup = require('extplug/settings/Group'),
    SettingsCheckbox = require('extplug/settings/CheckboxView'),
    SettingsError = require('extplug/settings/ErrorCheckboxView'),
    SettingsDropdown = require('extplug/settings/DropdownView'),
    Style = require('extplug/Style'),
    RoomSettings = require('extplug/RoomSettings'),
    fnUtils = require('extplug/util/function'),

    $ = require('jquery'),
    _ = require('underscore'),
    Backbone = require('backbone');

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
    var evts = Events._events['show:room'],
      i = 0,
      l = evts ? evts.length : 0;
    for (; i < l; i++) {
      // Backbone event handlers have a .ctx property, containing what they will be bound to.
      // And ApplicationView adds a handler that's bound to itself!
      if (evts[i].ctx instanceof ApplicationView) {
        return evts[i].ctx;
      }
    }
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
    this._modules = {};
    /**
     * Internal map of module names → whether they are enabled.
     * @type {Object.<string, boolean>}
     */
    this._enabled = {};
    /**
     * ExtPlug global settings. Includes global plug.dj settings.
     *
     * Plug.dj settings are a plain object internally, mirroring it here
     * as a Backbone model allows modules to listen for changes.
     * It's also nice to have a single global settings object instead of
     * one for extplug and one for plug...
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
    this.onRefresh = this.onRefresh.bind(this);
    this.onQuality = this.onQuality.bind(this);
    this.onSnooze = this.onSnooze.bind(this);
    this.onJoinedChange = this.onJoinedChange.bind(this);
  }

  /**
   * Installs a Module from a script URL.
   *
   * @param {string}     path URL to the Module script.
   * @param {function()} cb   Function to call when the Module script has loaded.
   */
  ExtPlug.prototype.install = function (path, cb) {
    $.getScript(path, cb);
  };

  /**
   * Define an ExtPlug module.
   *
   * @param {string}            name    Module name. This should be unique,
   *    and will not be displayed to the user.
   * @param {?Array.<string>}   deps    Array of Module Dependencies, like in requirejs.
   * @param {function():Module} factory Module factory function, like in requirejs.
   */
  ExtPlug.prototype.define = function (name, deps, factory) {
    var ext = this;
    var path = 'extplug/modules/' + name;
    define(path, deps, factory);
    require([ path ], function (Mod) {
      ext.register(Mod);
    });
  };

  /**
   * Enables a module.
   *
   * @param {string} name Module name.
   */
  ExtPlug.prototype.enable = function (name) {
    var mod = this._modules[name];
    if (mod) {
      if (!this._enabled[name]) {
        mod.enable();
      }
      // TODO set enabled as a property on the module?
      this._enabled[name] = true;
      this._updateEnabledModules();
    }
  };

  /**
   * Disables a module.
   *
   * @param {string} name Module name.
   */
  ExtPlug.prototype.disable = function (name) {
    if (this._enabled[name]) {
      var mod = this._modules[name];
      mod.disable();
      this._enabled[name] = false;
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
    return this._enabled[name] || false;
  };

  /**
   * Registers a new module.
   *
   * @param {function()} Mod A module constructor created with {@link Module}.
   *
   * @return {ExtPlug} `this`.
   */
  ExtPlug.prototype.register = function (Mod) {
    if (Mod._name) {
      try {
        this._modules[Mod._name] = new Mod(this);
      }
      catch (e) {
        this._modules[Mod._name] = e;
      }
    }
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

    this.syncPlugSettings();
    this.appView = getApplicationView();
    this.applicationSettingsView = AppSettingsSectionView.prototype;

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

    // TODO remove everything that is not used by ExtPlug directly
    // Modules can just $() them anyway.
    // video container
    this.playbackContainer = $('#playback-container');
    this.ytFrame = $('#yt-frame');
    // song duration countdown
    this.timeLeft = $('#now-playing-time span');
    // plug.dj video controls
    this.refreshButton = $('.refresh.button');
    this.hdButton = $('.hd.button');
    this.snoozeButton = $('.snooze.button');
    // vote buttons
    this.wootButton = $('#woot');
    this.mehButton = $('#meh');
    // waitlist
    this.djButton = $('#dj-button');
    // volume controls
    this.volumeElement = $('#volume');
    this.volumeSlider = this.volumeElement.find('.slider');
    this.volumeButton = this.volumeElement.find('.button');
    // user settings
    this.userSettings = $('#user-settings');

    this.document.on('click.extplug', this.onClick);

    currentMedia.on('change:volume', this.onVolume);

    this.refreshButton.on('click.extplug', this.onRefresh);
    this.hdButton.on('click.extplug', this.onQuality);
    this.snoozeButton.on('click.extplug', this.onSnooze);

    // add an ExtPlug settings tab to User Settings
    var settingsTab = $('<button />').addClass('ext-plug').text('ExtPlug');
    function addExtPlugSettingsTab(oldRender) {
      var ret = oldRender();
      var butt = settingsTab.clone();
      this.$el.append(butt);
      butt.on('click', this.onClickExt.bind(this));

      var buttons = this.$('button');
      buttons.css('width', 100 / buttons.length + '%');
      return ret;
    }
    fnUtils.replaceMethod(SettingsTabMenuView.prototype, 'render', addExtPlugSettingsTab);

    // Using a separate method, because the other tab buttons don't need to check for ext-plug anyway.
    // TODO this can probably just not call onClick() entirely
    SettingsTabMenuView.prototype.onClickExt = function (e) {
      this.onClick(e);
      if ($(e.target).hasClass('ext-plug')) {
        this.trigger('select', 'ext-plug');
      }
    };

    /**
     * Wires a control to a setting model, updating the model when the control changes.
     *
     * @param {Backbone.View} el Control view.
     * @param {Backbone.Model} settings Model to reflect the settings to.
     * @param {string} target Relevant property on the model.
     */
    function wireSettingToModel(el, settings, target) {
      el.on('change', function (value) {
        settings.set(target, value);
      });
    }
    // add the ExtPlug settings pane
    function addExtPlugSettingsPane(old, itemName) {
      if (itemName === 'ext-plug') {
        var view = new ExtSettingsSectionView();

        var modulesGroup = new SettingsGroup();
        // generate module list
        view.addGroup('Modules', modulesGroup, 1000);
        _.each(ext._modules, function (module, name) {
          if (module instanceof Error) {
            // this module errored out during its initialization
            modulesGroup.add(new SettingsError({ label: name }));
          }
          else {
            var box = new SettingsCheckbox({ label: name, enabled: ext.enabled(name) });
            modulesGroup.add(box);
            box.on('change', function (value) {
              // add / remove module settings group
              if (value) {
                ext.enable(name);
                var moduleSettings = getSettingsGroup(module);
                if (moduleSettings) {
                  view.addGroup(name, moduleSettings);
                  view.render();
                }
              }
              else {
                ext.disable(name);
                if (view.hasGroup(name)) {
                  view.removeGroup(name);
                  view.render();
                }
              }
            });
            // add module settings group for stuff that was already enabled
            if (ext.enabled(name)) {
              var moduleSettings = getSettingsGroup(module);
              if (moduleSettings) {
                view.addGroup(name, moduleSettings);
              }
            }
          }
        });

        // global ExtPlug settings
        var extGroup = new SettingsGroup();
        var useCorsProxy = new SettingsCheckbox({ label: 'Use CORS proxy', enabled: true });
        extGroup.add(useCorsProxy);
        wireSettingToModel(useCorsProxy, ext.settings, 'corsProxy');
        view.addGroup('ExtPlug', extGroup, 10);

        return view;
      }
      return old(itemName);
    }
    fnUtils.replaceMethod(UserSettingsView.prototype, 'getView', addExtPlugSettingsPane);

    this.on('deinit', function () {
      delete SettingsTabMenuView.prototype.onClickExt;
      fnUtils.unreplaceMethod(UserSettingsView.prototype, 'getView', addExtPlugSettingsPane);
      fnUtils.unreplaceMethod(SettingsTabMenuView.prototype, 'render', addExtPlugSettingsTab);
    });

    /**
     * Returns a SettingsGroup "view" for a given module's settings.
     * Events all wired up, ready to go!
     *
     * @param {Module} module The module to base this view on.
     * @return {SettingsGroup} Group of proper setting view instances.
     */
    function getSettingsGroup(module) {
      if (!module._settings) {
        return;
      }
      var group = new SettingsGroup();
      var meta = module._settings;
      var settings = module.settings;

      _.each(meta, function (setting, name) {
        var control;
        switch (setting.type) {
          case 'boolean':
            control = new SettingsCheckbox({
              label: setting.label,
              enabled: settings.get(name)
            });
            break;
          case 'dropdown':
            control = new SettingsDropdown({
              label: setting.label,
              options: setting.options,
              selected: setting.default
            });
            break;
          default:
            control = new SettingsError({ label: 'Unknown type for "' + name + '"' });
            break;
        }
        wireSettingToModel(control, settings, name);
        group.add(control);
      });

      return group;
    }

    // add custom chat message type
    // still a bit broked since the new chat system
    // TODO fix that^
    function addCustomChatType(oldReceived, message) {
      if (message.type === 'custom') {
        message.type += ' update';
        if (!message.timestamp) {
          message.timestamp = plugUtil.getChatTimestamp();
        }
        oldReceived(message);
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
        }
        if (message.color) {
          this.$chatMessages.children().last().find('.msg .text').css('color', message.color);
        }
      }
      else {
        oldReceived(message);
      }
    }

    // Replace the event listener too
    var chatView = this.appView.room && this.appView.room.chat;
    if (chatView) {
      Events.off('chat:receive', chatView.onReceived);
    }
    fnUtils.replaceMethod(ChatView.prototype, 'onReceived', addCustomChatType);
    this.on('deinit', function () {
      fnUtils.unreplaceMethod(ChatView.prototype, 'onReceived', addCustomChatType);
    });
    if (chatView) {
      Events.on('chat:receive', chatView.onReceived, chatView);
    }

    // room settings
    var roomSettings = new RoomSettings(this);
    this.roomSettings = roomSettings;
    this.on('deinit', function () {
      roomSettings.dispose();
    });

    /**
     * Maps a Plug.DJ API event to an event on the ExtPlug object.
     * @param {string} from API event name.
     * @param {string} to ExtPlug event name.
     */
    function mapEvent(from, to) {
      var fn = ext.trigger.bind(ext, to);
      API.on(from, fn);
      ext.on('deinit', function () { API.off(from, fn); });
    }
    mapEvent(API.ADVANCE, 'advance');
    mapEvent(API.USER_JOIN, 'userJoin');
    mapEvent(API.USER_LEAVE, 'userLeave');

    currentRoom.on('change:joined', this.onJoinedChange);

    this._loadEnabledModules();

    this.notify('icon-plug-dj', 'ExtPlug loaded');

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
   * Sets plug.dj settings on the ExtPlug settings model.
   */
  ExtPlug.prototype.syncPlugSettings = function () {
    var newSettings = _.extend({}, settings.settings);
    // when you mute a song using the volume button, plug.dj does not change the associated setting.
    // here we fake a volume of 0% anyway if the volume is muted, so ExtPlug modules can just
    // use volume throughout and have it work.
    if (newSettings.volume !== 0 && $('#volume .icon').hasClass('icon-volume-off')) {
      newSettings.volume = 0;
    }
    this.settings.set(newSettings);
  };

  /**
   * Persists enabled modules to localStorage.
   * @private
   */
  ExtPlug.prototype._updateEnabledModules = function () {
    var modules = {};
    _.each(this._modules, function (m, name) {
      modules[name] = {
        enabled: this._enabled[name] || false,
        settings: m.settings
      };
    }, this);
    localStorage.setItem('extPlugModules', JSON.stringify(modules));
  };

  /**
   * Enables modules and loads their settings from localStorage.
   * @private
   */
  ExtPlug.prototype._loadEnabledModules = function () {
    var enabled = localStorage.getItem('extPlugModulesEnabled');
    if (enabled) {
      var modules = JSON.parse(enabled);
      _.each(modules, function (m, name) {
        if (m.enabled) {
          this.enable(name);
        }
        this._modules[name].settings.set(m.settings);
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
      this.syncPlugSettings();
    }
  };

  /**
   * Volume change handler.
   *
   * @private
   */
  ExtPlug.prototype.onVolume = function () {
    var newVolume = API.getVolume();
    if (this.settings.get('volume') !== newVolume) {
      this.settings.set('volume', newVolume);
    }
  };

  /**
   * Snooze button click handler.
   *
   * @private
   */
  ExtPlug.prototype.onSnooze = function () {
    this.trigger('snooze');
  };

  /**
   * HD button click handler.
   *
   * @private
   */
  ExtPlug.prototype.onQuality = function () {
    this.syncPlugSettings();
  };

  /**
   * Refresh button click handler.
   *
   * @private
   */
  ExtPlug.prototype.onRefresh = function () {
    this.trigger('refresh');
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
   * 3rd party modules should use `extp.push` to register callbacks for when ExtPlug is loaded.
   * This ensures that modules that are loaded *after* ExtPlug will also register.
   *
   * @param {function()} cb
   */
  ExtPlug.prototype.push = function (cb) {
    cb(this);
  };

  /**
   * Displays a notification in the top right of the screen.
   *
   * @param {string} icon Notification icon class name.
   * @param {string} text Message.
   */
  ExtPlug.prototype.notify = function (icon, text) {
    Events.trigger('notify', icon, text);
  };

  /**
   * "Woot!"s the current song.
   */
  ExtPlug.prototype.woot = function () {
    this.wootButton.click();
  };

  /**
   * "Meh"s the current song.
   */
  ExtPlug.prototype.meh = function () {
    this.mehButton.click();
  };

  /**
   * Snoozes the current song.
   */
  ExtPlug.prototype.snooze = function () {
    this.snoozeButton.click();
  };

  /**
   * Tries to join the wait list.
   */
  ExtPlug.prototype.joinWaitlist = function () {
    if (this.djButton.hasClass('is-full')) {
      this.notify('icon-waitlist-full', lang.alerts.waitListFull);
    }
    else {
      this.djButton.click();
    }
  };

  /**
   * Shows a Dialog.
   *
   * @param {Dialog} dialog A dialog view instance. (Should extend "plug/views/dialogs/Dialog".)
   */
  ExtPlug.prototype.showDialog = function (dialog) {
    Events.dispatch(new ShowDialogEvent(ShowDialogEvent.SHOW, dialog));
  };

  module.exports = ExtPlug;

});
