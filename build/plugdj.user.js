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
      ext.register(name, Mod);
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
  ExtPlug.prototype.register = function (id, Mod) {
    if (Mod._name) {
      try {
        this._modules[Mod._name] = new Mod(id, this);
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
    var enabled = localStorage.getItem('extPlugModules');
    if (enabled && false) {
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
;define('extplug/Style', function (require, exports, module) {

  var _ = require('underscore'),
    $ = require('jquery');

  function Style(defaults) {
    this._rules = {};
    this._timeout = null;

    this.refresh = this.refresh.bind(this);

    this.el = $('<style>').attr('type', 'text/css').appendTo('head');

    if (_.isObject(defaults)) {
      this.set(defaults);
    }
  }

  Style.prototype.set = function (sel, props) {
    var rules = this._rules;
    if (props) {
      if (rules[sel]) {
        _.extend(rules[sel], props);
      }
      else {
        rules[sel] = props;
      }
    }
    else {
      _.each(sel, function (ruleset, selector) {
        if (rules[selector]) {
          _.extend(rules[selector], ruleset);
        }
        else {
          rules[selector] = ruleset;
        }
      });
    }

    // throttle updates
    clearTimeout(this._timeout);
    this._timeout = setTimeout(this.refresh, 1);
    return this;
  };

  Style.prototype.refresh = function () {
    this.el.text(this.toString());
  };

  Style.prototype.remove = function () {
    this.el.remove();
  };

  Style.prototype.toString = function () {
    var str = '',
      rules = this._rules;
    Object.keys(rules).forEach(function (selector) {
      var ruleset = rules[selector];
      str += selector + ' {\n';
      Object.keys(ruleset).forEach(function (property) {
        str += '  ' + property + ': ' + ruleset[property] + ';\n';
      });
      str += '}\n\n';
    });
    return str;
  };

  return Style;

});
;define('extplug/Module', function (require, exports, module) {

  var jQuery = require('jquery'),
    _ = require('underscore'),
    Backbone = require('backbone'),
    SettingsGroup = require('extplug/settings/Group'),
    Settings = require('extplug/models/Settings'),
    Style = require('extplug/Style'),
    fnUtils = require('extplug/util/function');

  /**
   * @param {string}  name      Module name.
   * @param {Object=} prototype Module prototype.
   */
  function Module(prototype) {
    function Constructor(id, ext) {
      if (!(this instanceof Constructor)) return new Constructor(ext);
      _.extend(this, Backbone.Events);

      this.id = id;

      /**
       * @type {Array.<Style>}
       */
      this._styles = [];

      /**
       * @type {ExtPlug}
       */
      this.ext = ext;

      var settings = new Settings({});
      if (this.settings) {
        _.each(this.settings, function (setting, name) {
          settings.set(name, setting.default);
        });
        this._settings = this.settings;
      }
      this.settings = settings;
      this.loadSettings();

      fnUtils.bound(this, 'refresh');
      fnUtils.bound(this, 'enable');
      fnUtils.bound(this, 'disable');
      fnUtils.bound(this, '$');
      fnUtils.bound(this, 'saveSettings');

      this.settings.on('change', this.saveSettings);

      this.init();
    }

    Constructor._name = prototype.name;
    delete prototype.name;

    _.extend(Constructor.prototype, Module.prototype);

    if (prototype) {
      if (prototype.disable) {
        prototype._disable = prototype.disable;
        delete prototype.disable;
      }
      _.extend(Constructor.prototype, prototype);
    }

    return Constructor;
  }

  Module.prototype.init = function () {};

  Module.prototype.$ = function (sel) {
    return sel ? jQuery(sel, this.ext.document) : this.ext.document;
  };

  Module.prototype.loadSettings = function () {
    var settings = localStorage.getItem('extPlugModule_' + this.id);
    if (settings) {
      this.settings.set(JSON.parse(settings));
    }
  };

  Module.prototype.saveSettings = function () {
    localStorage.setItem('extPlugModule_' + this.id, JSON.stringify(this.settings));
  };

  Module.prototype.disable = function () {
    if (this._disable) {
      this._disable();
    }
    this.removeStyles();
  };

  Module.prototype.refresh = function () {
    this.disable();
    this.enable();
  };

  Module.prototype.Style = function (o) {
    var style = new Style(o);
    this._styles.push(style);
    return style;
  };

  Module.prototype.removeStyles = function () {
    while (this._styles.length > 0) {
      this._styles.pop().remove();
    }
  };

  module.exports = Module;

});
;define('extplug/util/function', function (require, exports, module) {

  var _ = require('underscore');

  // the point of replaceMethod & unreplaceMethod is to be able to mask methods
  // and then unmask them in any order. It's probably kinda iffy right now
  // also need to figure out how to replace bound methods on all instances of a prototype...
  exports.replaceMethod = function (obj, key, fn) {
    var newFn = function () {
      var args = _.toArray(arguments);
      return fn.apply(this, [ newFn._replaces.bind(this) ].concat(args));
    };

    newFn._replaces = obj[key];
    newFn._function = fn;
    obj[key] = newFn;
  };

  exports.unreplaceMethod = function (obj, key, fn) {
    var currentFn = obj[key];
    // this replacement was most recently applied
    if (currentFn._function === fn) {
      obj[key] = currentFn._replaces;
    }
    else {
      // this replacement was applied somewhere down the chain
      var previousFn;
      while (currentFn._function !== fn && currentFn._replaces) {
        previousFn = currentFn;
        currentFn = currentFn._replaces;
      }
      if (currentFn._function === fn) {
        previousFn._replaces = currentFn._replaces;
      }
    }
  };

  exports.bound = function (obj, key) {
    obj[key] = obj[key].bind(obj);
  };

});
;define('extplug/util/request', function (require, exports, module) {

  var $ = require('jquery');

  module.exports = request;

  var corsproxy = 'https://cors-anywhere.herokuapp.com/';

  function request(url, options) {
    var ajax = $.ajax(url, options);
    // try to work around CORS blocks
    if (mayNeedProxy(url)) {
      ajax = ajax.then(null, function () {
        return $.ajax(corsproxy + url);
      });
    }
    return ajax;
  }

  request.url = function (url) {
    return mayNeedProxy(url) ? corsproxy + url : url;
  };

  request.json = function (url, options) {
    options = options || {};
    options.dataType = 'json';
    return request(url, options);
  };

  function parseUrl(url) {
    var e = document.createElement('a');
    e.href = url;
    return e;
  }

  function mayNeedProxy(url) {
    if (url.substr(0, corsproxy.length) !== corsproxy) {
      var loc = parseUrl(url);
      if (loc.hostname !== 'plug.dj' && loc.hostname !== 'cdn.plug.dj') {
        return true;
      }
    }
    return false;
  }

});
;define('extplug/RoomSettings', function (require, exports, module) {

  var currentRoom = require('plug/models/currentRoom'),
    request = require('extplug/util/request'),
    fnUtils = require('extplug/util/function'),
    Backbone = require('backbone');

  var RoomSettings = Backbone.Model.extend({

    constructor: function (ext) {
      Backbone.Model.call(this, {});

      this._loaded = {};

      fnUtils.bound(this, 'load');
      fnUtils.bound(this, 'unload');
      fnUtils.bound(this, 'reload');

      currentRoom.on('change:description', this.reload);
      ext.on('room:joined', this.load);
      ext.on('room:left', this.unload);

      if (currentRoom.get('joined')) {
        this.load();
      }
    },

    load: function () {
      var description = currentRoom.get('description'),
        m = description.match(/(?:^|\n)@p3=(.*?)(?:\n|$)/);

      if (m) {
        if (this._loaded[m[1]]) {
          this.onLoad(this._loaded[m[1]]);
        }
        else {
          request.json(m[1]).then(function (response) {
            this._loaded[m[1]] = response;
            this.onLoad(response);
          }.bind(this));
        }
      }
    },

    onLoad: function (settings) {
      this.clear();
      this.trigger('load', settings);
      this.set(settings);
    },

    unload: function () {
      this.clear();
      this.trigger('unload');
    },

    reload: function () {
      if (currentRoom.get('joined')) {
        this.unload();
        this.load();
      }
    },

    dispose: function () {
      currentRoom.off('change:description', this.refresh);
    }

  });

  module.exports = RoomSettings;

});
;define('extplug/models/Settings', function (require, exports, module) {

  var Backbone = require('backbone');

  var Settings = Backbone.Model.extend({});

  module.exports = Settings;

});
;define('extplug/settings/SettingsView', function (require, exports, module) {
  var Backbone = require('backbone'),
    $ = require('jquery');

  var SettingsView = Backbone.View.extend({
    className: 'ext-plug section',

    initialize: function () {
      this.groups = [];
    },

    render: function () {
      var container = $('<div>').addClass('container');
      this.$el.empty().append(container);

      this.sort();
      this.groups.forEach(function (group) {
        container.append($('<div>').addClass('header').append($('<span>').text(group.name)));
        container.append(group.items.render());
      }, this);

      return this;
    },

    sort: function () {
      this.groups.sort(function (a, b) {
        var c = b.priority - a.priority;
        if (c === 0) {
          c = a.name > b.name ? 1 : a.name < b.name ? -1 : 0;
        }
        return c;
      });
    },

    onResize: function () {
    },

    addGroup: function (name, items, priority) {
      this.groups.push({
        name: name,
        items: items,
        priority: typeof priority === 'number' ? priority : 0
      });
    },

    getGroup: function (name) {
      for (var i = 0, l = this.groups.length; i < l; i++) {
        if (this.groups[i].name === name) {
          return this.groups[i].items;
        }
      }
    },

    hasGroup: function (name) {
      return this.groups.some(function (group) {
        return group.name === name;
      });
    },

    removeGroup: function (name) {
      for (var i = 0, l = this.groups.length; i < l; i++) {
        if (this.groups[i].name === name) {
          return this.groups.splice(i, 1);
        }
      }
    }

  });

  module.exports = SettingsView;

});
;define('extplug/settings/Group', function (require, exports, module) {

  var $ = require('jquery'),
    _ = require('underscore');

  /**
   * Creates an array with some setting group methods.
   * @param {?Array} group An array of setting items.
   */
  var Group = function (group) {
    if (!_.isArray(group)) {
      group = [];
    }
    /**
     * Renders the setting group.
     * @return {DocumentFragment} A DocumentFragment containing the setting group DOM.
     */
    group.render = function () {
      var el = document.createDocumentFragment();
      var switchAt = Math.ceil(this.length / 2 - 1),
        current = $('<div />').addClass('left').appendTo(el);
      this.forEach(function (item, i) {
        current.append(item.$el);
        item.render();
        if (i === switchAt) {
          current = $('<div />').addClass('right').appendTo(el);
        }
      });
      return el;
    };
    group.add = group.push;
    return group;
  };

  module.exports = Group;

});
;define('extplug/settings/CheckboxView', function (require, exports, module) {

  var Backbone = require('backbone'),
    $ = require('jquery');

  /**
   * A checkbox setting item.
   */
  var CheckboxView = Backbone.View.extend({
    className: 'item',
    initialize: function (o) {
      this.label = o.label;
      this.enabled = o.enabled || false;
      this.onChange = this.onChange.bind(this);
    },
    render: function () {
      this.$el
        .append('<i class="icon icon-check-blue" />')
        .append($('<span />').text(this.label));

      if (this.enabled) {
        this.$el.addClass('selected');
      }

      this.$el.on('click', this.onChange);
      return this;
    },
    onChange: function () {
      this.$el.toggleClass('selected');
      var enabled = this.enabled;
      this.enabled = this.$el.hasClass('selected');
      if (enabled !== this.enabled) {
        this.trigger('change', this.getValue());
      }
    },
    getValue: function () {
      return this.enabled;
    },
    setValue: function (enabled) {
      this.enabled = enabled;
      if (enabled) {
        this.$el.addClass('selected');
      }
      else {
        this.$el.removeClass('selected');
      }
    }
  });

  module.exports = CheckboxView;

});
;define('extplug/settings/DropdownView', function (require, exports, module) {

  var Backbone = require('backbone'),
    $ = require('jquery'),
    _ = require('underscore'),
    fnUtils = require('extplug/util/function');

  var DropdownView = Backbone.View.extend({
    className: 'dropdown',
    tagName: 'dl',
    initialize: function () {
      if (!this.options.selected) {
        this.options.selected = Object.keys(this.options.options)[0];
      }

      fnUtils.bound(this, 'onDocumentClick');
      fnUtils.bound(this, 'onBaseClick');
      fnUtils.bound(this, 'onRowClick');
    },
    render: function () {
      this.$selectedValue = $('<span />');
      this.$selected = $('<dt />')
        .append(this.$selectedValue)
        .append($('<i />').addClass('icon icon-arrow-down-grey'))
        .append($('<i />').addClass('icon icon-arrow-up-grey'));

      this.$rows = $('<dd />');
      var selected;
      _.each(this.options.options, function (text, value) {
        var row = $('<div />').addClass('row').data('value', value),
          el = $('<span />').text(text);
        if (this.options.selected === value) {
          selected = row;
        }
        row.append(el).appendTo(this.$rows);
      }, this);

      this.$el
        .append(this.$selected)
        .append(this.$rows);

      this.$selected.on('click', this.onBaseClick);
      this.$rows.on('click', this.onRowClick);
      // trigger the above as a default
      if (selected) {
        selected.click();
      }
      return this;
    },
    close: function () {
      this.$el.removeClass('open');
      $(document).off('click', this.onDocumentClick);
    },
    remove: function () {
      this.$('dt, dd').off();
      $(document).off('click', this.onDocumentClick);
      this._super();
    },
    onBaseClick: function (e) {
      if (this.$el.hasClass('open')) {
        this.close();
      }
      else {
        this.$el.addClass('open');
        var self = this;
        _.defer(function () { $(document).on('click', self.onDocumentClick); });
      }
    },
    onRowClick: function (e) {
      var row = $(e.target).closest('.row');
      this.$('.row').removeClass('selected');
      row.addClass('selected');
      this.$el.removeClass('open');
      this.$selectedValue.text(row.text());
      this.trigger('select', row.data('value'));
    },
    onDocumentClick: function (e) {
      _.defer(this.close.bind(this));
    },
    getValue: function () {
      return this.$rows.find('.selected').data('value');
    },
    setValue: function () {
      
    }
  });

  module.exports = DropdownView;

});
;define('extplug/settings/ErrorCheckboxView', function (require, exports, module) {

  var Backbone = require('backbone'),
    $ = require('jquery');

  /**
   * A checkbox setting item.
   */
  var ErrorCheckboxView = Backbone.View.extend({
    className: 'item',
    initialize: function (o) {
      this.name = o.name;
      this.label = o.label;
    },
    render: function () {
      this.$el
        .append('<i class="icon icon-chat-system" />')
        .append($('<span />').css({ color: '#c42e3b' }).text(this.label));

      if (this.enabled) {
        this.$el.addClass('selected');
      }

      this.$el.on('click', this.onChange);
      return this;
    },
    getValue: function () {
      return false;
    },
    setValue: function (enabled) {
      // nothing
    }
  });

  module.exports = ErrorCheckboxView;

});
;
(extp = window.extp || []).push(function (ext) {

  ext.define('Autowoot', function (require, exports, module) {

    var Module = require('extplug/Module'),
      fnUtils = require('extplug/util/function');

    module.exports = Module({
      name: 'Autowoot',

      init: function () {
        fnUtils.bound(this, 'onAdvance');
      },

      enable: function () {
        this.wootElement = this.$('#woot');
        this.ext.woot();
        this.ext.on('advance', this.onAdvance);
      },

      disable: function () {
        this.ext.off('advance', this.onAdvance);
      },

      onAdvance: function () {
        setTimeout(this.ext.woot.bind(this.ext), 3000 + Math.floor(Math.random() * 5000));
      }

    });

  });

});;(extp = window.extp || []).push(function (ext) {

  ext.define('ChatNotifications', function (require, exports, module) {

    var Module = require('extplug/Module'),
      Events = require('plug/core/Events');

    module.exports = Module({
      name: 'Chat Notifications',

      settings: {
        userJoin: { type: 'boolean', label: 'User Join', default: true },
        userLeave: { type: 'boolean', label: 'User Leave', default: true },
        advance: { type: 'boolean', label: 'DJ Advance', default: true },
        grab: { type: 'boolean', label: 'Media Grab', default: true },
        meh: { type: 'boolean', label: 'Meh Vote', default: true }
      },

      init: function () {
        this.onJoin = this.onJoin.bind(this);
        this.onLeave = this.onLeave.bind(this);
        this.onAdvance = this.onAdvance.bind(this);
        this.onGrab = this.onGrab.bind(this);
      },

      enable: function () {
        API.on(API.USER_JOIN, this.onJoin);
        API.on(API.USER_LEAVE, this.onLeave);
        API.on(API.ADVANCE, this.onAdvance);
        API.on(API.GRAB_UPDATE, this.onGrab);
      },

      disable: function () {
        API.off(API.USER_JOIN, this.onJoin);
        API.off(API.USER_LEAVE, this.onLeave);
        API.off(API.ADVANCE, this.onAdvance);
        API.off(API.GRAB_UPDATE, this.onGrab);
      },

      onJoin: function (e) {
        if (this.settings.get('userJoin')) {
          this.log('joined the room', e.id, e.username, '#2ECC40');
        }
      },

      onLeave: function (e) {
        if (this.settings.get('userLeave')) {
          this.log('left the room', e.id, e.username, '#FF4136');
        }
      },

      onAdvance: function (e) {
        if (this.settings.get('advance')) {
          this.log('Now Playing: ' + e.media.author + ' – ' + e.media.title, e.dj.id, e.dj.username, '#7FDBFF');
        }
      },

      onGrab: function (e) {
        if (this.settings.get('grab')) {
          var media = API.getMedia();
          this.log('grabbed ' + media.author + ' – ' + media.title, e.user.id, e.user.username, '#B10DC9');
        }
      },

      log: function (msg, uid, username, color, badge) {
        Events.trigger('chat:receive', {
          type: 'custom',
          color: color,
          message: msg,
          uid: uid,
          un: username
        });
      }
    });

  });

});
;(extp = window.extp || []).push(function (ext) {

  ext.define('RoomStyles', function (require, exports, module) {

    var Module = require('extplug/Module'),
      request = require('extplug/util/request'),
      fnUtils = require('extplug/util/function'),
      _ = require('underscore'),
      $ = require('jquery');

    module.exports = Module({
      name: 'Room Styles',

      init: function () {
        fnUtils.bound(this, 'colors');
        fnUtils.bound(this, 'css');
        fnUtils.bound(this, 'images');
        fnUtils.bound(this, 'unload');
      },

      enable: function () {
        this.all();

        this.ext.roomSettings
          .on('change:colors', this.colors)
          .on('change:css', this.css)
          .on('change:images', this.images);

        this.ext.on('room:left', this.unload);
      },

      disable: function () {
        this.ext.roomSettings
          .off('change:colors', this.colors)
          .off('change:css', this.css)
          .off('change:images', this.images);

        this.ext.off('room:left', this.unload);
      },

      colors: function () {
        var colors = this.ext.roomSettings.get('colors');
        if (_.isObject(colors)) {
          var colorStyles = this.Style();

          if (_.isObject(colors.chat)) {
            [ 'admin', 'ambassador', 'host', 'cohost', 'manager', 'bouncer', 'dj' ]
              .forEach(function (level) {
                if (colors.chat[level]) {
                  var value = { color: '#' + colors.chat[level] + ' !important' };
                  colorStyles
                    .set('#chat-messages .icon-chat-' + level + ' ~ .from', value)
                    .set('#user-rollover .icon-chat-' + level + ' + span', value)
                    .set('#user-lists    .icon-chat-' + level + ' + span', value)
                    .set('#waitlist      .icon-chat-' + level + ' + span', value);
                }
              });
          }
        }
      },

      css: function () {
        var css = this.ext.roomSettings.get('css');
        if (_.isObject(css)) {
          if (_.isObject(css.rule)) {
            this.Style(css.rule);
          }

          if (_.isArray(css.import)) {
            this._imports = $('<style>').text(
              css.import.map(function (url) {
                return '@import url(' + request.url(url) + ');';
              }).join('\n')
            );
          }
        }
      },

      images: function () {
        var images = this.ext.roomSettings.get('images');
        if (_.isObject(images)) {
          if (images.background) {
            this.Style({
              '.room-background': {
                'background-image': 'url(' + images.background + ') !important'
              }
            });
          }
          if (images.playback) {
            var playbackImg = this.$('#playback .background img');
            this._oldPlayback = playbackImg.attr('src');
            playbackImg.attr('src', images.playback);
          }
          if (images.booth) {
            this.$booth = $('<div />').css({
              'background': 'url(' + images.booth + ') no-repeat center center',
              'position': 'absolute',
              'width': '300px',
              'height': '100px',
              'left': '-64px',
              'top': '70px',
              'z-index': -1
            }).appendTo(this.$('#dj-booth'));
          }
        }
      },

      all: function () {
        this.colors();
        this.css();
        this.images();
      },

      unload: function () {
        if (this.$booth) {
          this.$booth.remove();
        }
        if (this._oldPlayback) {
          this.$('#playback .background img').attr('src', this._oldPlayback);
          delete this._oldPlayback;
        }
        if (this._imports) {
          this._imports.remove();
          this._imports = null;
        }
        this.removeStyles();
      }

    });

  });

});
;(extp = window.extp || []).push(function (ext) {

  ext.define('MehIcon', function (require, exports, module) {

    var Module = require('extplug/Module'),
      UserRowView = require('plug/views/room/users/RoomUserRowView'),
      $ = require('jquery');

    var MehIcon = Module({
      name: 'Meh Icons',

      enable: function () {
        var mehIcon = this;
        this._vote = UserRowView.prototype.vote;
        UserRowView.prototype.vote = function () {
          mehIcon._vote.call(this);
          mehIcon.showMeh.call(this);
        };
        this.Style({
          '#user-lists .list.room .user .icon-meh': {
            'top': '-1px',
            'right': '9px',
            'left': 'auto'
          }
        });
      },

      disable: function () {
        UserRowView.prototype.vote = this._vote;
      },

      showMeh: function () {
        if (this.model.get('vote') === -1 && !this.model.get('grab')) {
          if (!this.$icon) {
            this.$icon = $('<i />');
            this.$el.append(this.$icon);
          }
          this.$icon.removeClass().addClass('icon icon-meh extplug-meh-icon');
        }
      }
    });

    module.exports = MehIcon;

  });

});;(extp = window.extp || []).push(function (ext) {

  ext.define('RolloverBlurbs', function (require, exports, module) {

    var Module = require('extplug/Module'),
      fnUtils = require('extplug/util/function'),
      rolloverView = require('plug/views/user/userRolloverView'),
      UserFindAction = require('plug/actions/user/UserFindAction'),
      $ = require('jquery');

    var emoji = $('<span />').addClass('emoji-glow')
      .append($('<span />').addClass('emoji emoji-1f4dd'));

    module.exports = Module({
      name: 'Rollover Blurb (Experimental)',
      description: 'Show user "Blurb" / bio in rollover popups.',

      enable: function () {
        this.Style({
          '.extplug-blurb': {
            padding: '10px',
            position: 'absolute',
            top: '3px',
            background: '#282c35',
            width: '100%',
            'box-sizing': 'border-box',
            display: 'none'
          },
          '.expand .extplug-blurb': {
            display: 'block'
          }
        });

        fnUtils.replaceMethod(rolloverView, 'showModal', this.addBlurb);
        fnUtils.replaceMethod(rolloverView, 'hide', this.removeBlurb);
      },

      disable: function () {
        fnUtils.unreplaceMethod(rolloverView, 'showModal', this.addBlurb);
        fnUtils.unreplaceMethod(rolloverView, 'hide', this.removeBlurb);
      },

      addBlurb: function (showModal, _arg) {
        var self = this;
        this.$('.extplug-blurb-wrap').remove();
        var span = $('<span />').addClass('extplug-blurb');
        var div = $('<div />').addClass('info extplug-blurb-wrap').append(span);
        if (this.user.get('blurb')) {
          show(this.user.get('blurb'));
        }
        else {
          new UserFindAction(this.user.get('id')).on('success', function (user) {
            self.user.set('blurb', user.blurb);
            show(user.blurb);
          });
        }
        showModal(_arg);

        function show(blurb) {
          if (blurb) {
            self.$('.actions').before(div);
            span.append(emoji, ' ' + blurb);
            div.height(span[0].offsetHeight + 6);
            self.$el.css('top', (parseInt(self.$el.css('top'), 10) - div.height()) + 'px');
          }
        }
      },
      removeBlurb: function (hide, _arg) {
        this.$('.extplug-blurb-wrap').remove();
        hide(_arg);
      }

    });

  });

});;(extp = window.extp || []).push(function (ext) {

  ext.define('FullSizeVideo', function (require, exports, module) {
    var Module = require('extplug/Module'),
      fnUtils = require('extplug/util/function'),
      win = require('plug/util/window');

    module.exports = Module({
      name: 'Full-Size Video',

      init: function () {
        fnUtils.bound(this, 'enter');
        fnUtils.bound(this, 'leave');
      },

      enable: function () {
        this.Style({
          '#playback': {
            left: '0px !important',
            right: '343px !important',
            width: 'auto !important',
            bottom: '54px !important',
            height: 'auto !important'
          },
          '#playback .background img': { display: 'none' },
          '#playback-controls': {
            left: '25% !important',
            width: '50% !important'
          },
          '#playback-container': {
            top: '0px !important',
            left: '0px !important',
            right: '0px !important',
            width: 'auto !important',
            bottom: '0px !important',
            height: 'auto !important',
            background: '#000'
          },
          '#avatars-container': { display: 'none !important' }
        });
        setTimeout(function () {
          win.onResize();
        }, 1);

        this.$('#playback').on('mouseenter', this.enter).on('mouseleave', this.leave);
        this.leave();
      },

      enter: function () {
        this.$('#dj-button, #vote').show();
      },
      leave: function (e) {
        // don't hide if the new target is one of the buttons
        if (e && e.relatedTarget && $(e.relatedTarget).closest('#dj-button, #vote').length > 0) {
          return;
        }
        this.$('#dj-button, #vote').hide();
      },

      disable: function () {
        this.enter();
        this.$('#playback').off('mouseenter', this.enter).off('mouseleave', this.leave);
        setTimeout(function () {
          win.onResize();
        }, 1);
      }

    });

  });

});;
;(function _initExtPlug() {

  if (window.API) {
    /**
 * Adds a module definition.
 *
 * @param {string} name Module name.
 * @param {*} module Module definition. (Not its factory!)
 */
var setDefine = function (name, module) {
  require.s.contexts._.defined[name] = module;
};

/**
 * Find a plug.dj module that matches a filter function.
 *
 * @param {function()} fn Filter function `fn(module)`.
 * @return {?Object} Module, or undefined if no matching module was found.
 */
var plugRequire = function (fn) {
  var defines = require.s.contexts._.defined,
    i, module;
  for (i in defines) if (defines.hasOwnProperty(i)) {
    module = defines[i];
    if (module && fn(module)) {
      module.originalModuleName = i;
      return module;
    }
  }
};

/**
 * Creates a function that matches an Event module.
 *
 * @param {string} name Event name.
 * @return {function()} Matcher function.
 */
var eventModule = function (name) {
  return function (module) { return module._name === name; };
};

/**
 * Creates a function that matches a REST Command module.
 *
 * @param {string} method REST method to match.
 * @param {string} url REST URL to match.
 * @return {function()} Matcher function.
 */
var commandModule = function (method, url) {
  return function (m) {
    return m.prototype && functionContains(m.prototype.execute, '.execute("' + method.toUpperCase()) &&
      functionContains(m.prototype.execute, url);
  };
};

/**
 * Tests if a module is a collection of a certain type of Model.
 *
 * @param {Object} m Module.
 * @param {function()} Model The Model.
 * @return {boolean} True if the module is a collection of the given models, false otherwise.
 */
var isCollectionOf = function (m, Model) {
  return m instanceof Backbone.Collection && m.model === Model;
};

/**
 * Checks if the given module is a Dialog class.
 *
 * @param {Object} m Module.
 * @return True if the module is a Dialog class, false otherwise.
 */
var isDialog = function (m) {
  return m.prototype && m.prototype.className && m.prototype.className.indexOf('dialog') !== -1;
};

/**
 * Checks if two functions are sort of the same by comparing their source.
 *
 * @param {function()} a Function.
 * @param {function()} b Function.
 * @return True if the functions look somewhat alike, false otherwise.
 */
var functionsSeemEqual = function (a, b) {
  return (a + '').replace(/\s/g, '') === (b + '').replace(/\s/g, '');
};

/**
 * Checks if a function's source contains a given string.
 *
 * @param {function()} fn Function.
 * @param {string} match String to look for.
 * @return True if fn contains the string, false otherwise.
 */
var functionContains = function (fn, match) {
  return _.isFunction(fn) && fn.toString().indexOf(match) !== -1;
};

/**
 * Creates a function that matches a View class with the given element ID.
 *
 * @param {string} id ID.
 * @return {function()} Matcher function.
 */
var viewModuleById = function (id) {
  return function (m) {
    return isView(m) && m.prototype.id === id;
  };
};

/**
 * Checks if a given module is a View class.
 *
 * @param {Object} m Module.
 * @return True if the module is a View class, false otherwise.
 */
var isView = function (m) {
  return m.prototype && _.isFunction(m.prototype.render) && _.isFunction(m.prototype.$);
};

/**
 * Checks if a given module has a defaults property (plug.dj models).
 *
 * @param {Object} m Module.
 * @return True if the module has defaults, false otherwise.
 */
var hasDefaults = function (m) {
  return m.prototype && m.prototype.defaults;
};

/**
 * Checks if a View template contains an element matching a given CSS selector.
 *
 * @param {function()} View View class.
 * @param {string} sel CSS Selector.
 * @return True if the View instance contains a matching element, false otherwise.
 */
var viewHasElement = function (View, sel) {
  var stubEl = $('<div>');
  var x = new View({ el: stubEl });
  x.render();
  var has = x.$(sel).length > 0;
  x.remove();
  return has;
};

/**
 * A stub matcher function, matching nothing, for modules that can not yet be matched uniquely.
 *
 * @return {bool} false.
 */
var todo = function () {
  return false;
};

/**
 * Map improvised module name → module filter function. (that hopefully matches only the right module!)
 * This is quite brittle because Plug.DJ can change their internals at any given moment :'
 */
var plugModules = {

  'plug/actions/Action': function (m) {
    return m.prototype && _.isFunction(m.prototype.alert) && _.isFunction(m.prototype.permissionAlert);
  },
  'plug/actions/actionQueue': function (m) {
    return _.isArray(m.queue) && _.isFunction(m.add) && _.isFunction(m.append) &&
      _.isFunction(m.next) && _.isFunction(m.complete);
  },

  'plug/actions/auth/AuthResetAction': commandModule('POST', 'auth/reset/me'),
  'plug/actions/auth/AuthTokenAction': commandModule('GET', 'auth/token'),
  'plug/actions/auth/FacebookAuthAction': commandModule('POST', 'auth/facebook'),
  'plug/actions/auth/KillSessionAction': commandModule('DELETE', 'auth/session'),
  'plug/actions/bans/BanAction': commandModule('POST', 'bans/add'),
  'plug/actions/bans/ListBansAction': commandModule('GET', 'bans'),
  'plug/actions/bans/UnbanAction': commandModule('DELETE', 'bans/'),
  'plug/actions/booth/JoinWaitlistAction': commandModule('POST', 'booth'),
  'plug/actions/booth/LeaveWaitlistAction': commandModule('DELETE', 'booth'),
  'plug/actions/booth/ModerateAddDJAction': commandModule('POST', 'booth/add'),
  'plug/actions/booth/ModerateForceSkipAction': commandModule('POST', 'booth/skip'),
  'plug/actions/booth/ModerateRemoveDJAction': commandModule('DELETE', 'booth/remove/'),
  'plug/actions/booth/SkipTurnAction': commandModule('POST', 'booth/skip/me'),
  'plug/actions/booth/BoothLockAction': commandModule('PUT', 'booth/lock'),
  'plug/actions/booth/BoothMoveAction': commandModule('POST', 'booth/move'),
  'plug/actions/booth/BoothSetCycleAction': commandModule('PUT', 'booth/cycle'),
  'plug/actions/friends/BefriendAction': commandModule('POST', 'friends'),
  'plug/actions/friends/UnfriendAction': commandModule('DELETE', 'friends/'),
  'plug/actions/ignores/IgnoreAction': commandModule('POST', 'ignores'),
  'plug/actions/ignores/UnignoreAction': commandModule('DELETE', 'ignores/'),
  'plug/actions/ignores/IgnoresListAction': commandModule('GET', 'ignores'),
  'plug/actions/media/ListMediaAction': commandModule('GET', 'playlists/'),
  'plug/actions/media/MediaDeleteAction': commandModule('POST', 'playlists/"+this.id+"/media/delete'),
  'plug/actions/media/MediaGrabAction': commandModule('POST', 'grabs'),
  'plug/actions/media/MediaInsertAction': commandModule('POST', 'playlists/"+this.id+"/media/insert'),
  'plug/actions/media/MediaMoveAction': commandModule('PUT', 'playlists/"+this.id+"/media/move'),
  'plug/actions/media/MediaUpdateAction': commandModule('PUT', 'playlists/"+this.id+"/media/update'),
  'plug/actions/media/SearchPlaylistsAction': commandModule('GET', 'playlists/media?q='),
  'plug/actions/mutes/MuteAction': commandModule('POST', 'mutes'),
  'plug/actions/mutes/UnmuteAction': commandModule('DELETE', 'mutes/'),
  'plug/actions/mutes/MutesListAction': commandModule('GET', 'mutes'),
  'plug/actions/news/NewsListAction': commandModule('GET', 'news'),
  'plug/actions/notifications/NotificationReadAction': commandModule('DELETE', 'notifications/'),
  'plug/actions/playlists/ListPlaylistsAction': commandModule('GET', 'playlists'),
  'plug/actions/playlists/PlaylistActivateAction': commandModule('PUT', 'playlists/"+this.data+"/activate'),
  'plug/actions/playlists/PlaylistCreateAction': commandModule('POST', 'playlists'),
  'plug/actions/playlists/PlaylistDeleteAction': commandModule('DELETE', 'playlists/'),
  'plug/actions/playlists/PlaylistRenameAction': commandModule('PUT', 'playlists/"+this.id+"/rename'),
  'plug/actions/playlists/PlaylistShuffleAction': commandModule('PUT', 'playlists/"+this.data+"/shuffle'),
  'plug/actions/profile/SetBlurbAction': commandModule('PUT', 'profile/blurb'),
  'plug/actions/rooms/ListFavoritesAction': commandModule('GET', 'rooms/favorites'),
  'plug/actions/rooms/ListMyRoomsAction': commandModule('GET', 'rooms/me'),
  'plug/actions/rooms/ListRoomsAction': commandModule('GET', 'rooms'),
  'plug/actions/rooms/ModerateDeleteChatAction': commandModule('DELETE', 'chat/"+this.data'),
  'plug/actions/rooms/RoomCreateAction': commandModule('POST', 'rooms'),
  'plug/actions/rooms/RoomFavoriteAction': commandModule('POST', 'rooms/favorites'),
  'plug/actions/rooms/RoomHistoryAction': commandModule('GET', 'rooms/history'),
  'plug/actions/rooms/RoomJoinAction': commandModule('POST', 'rooms/join'),
  'plug/actions/rooms/RoomStateAction': commandModule('GET', 'rooms/state'),
  'plug/actions/rooms/RoomUnfavoriteAction': commandModule('DELETE', 'rooms/favorites'),
  'plug/actions/rooms/RoomUpdateAction': commandModule('POST', 'rooms/update'),
  'plug/actions/rooms/RoomValidateAction': commandModule('GET', 'rooms/validate'),
  'plug/actions/rooms/VoteAction': commandModule('POST', 'votes'),
  'plug/actions/staff/StaffListAction': commandModule('GET', 'staff'),
  'plug/actions/staff/StaffRemoveAction': commandModule('DELETE', 'staff/'),
  'plug/actions/staff/StaffUpdateAction': commandModule('POST', 'staff/update'),
  'plug/actions/store/AvatarPurchaseAction': commandModule('POST', 'store/purchase'),
  'plug/actions/store/ProductsAction': commandModule('GET', 'store/products'),
  'plug/actions/store/InventoryAction': commandModule('GET', 'store/inventory'),
  'plug/actions/user/SetStatusAction': commandModule('PUT', 'users/status'),
  'plug/actions/user/SetLanguageAction': commandModule('PUT', 'users/language'),
  'plug/actions/user/SetAvatarAction': commandModule('PUT', 'users/avatar'),
  'plug/actions/user/MeAction': commandModule('GET', '"users/me"'),
  'plug/actions/user/UserHistoryAction': commandModule('GET', 'users/me/history'),
  'plug/actions/user/UserFindAction': commandModule('GET', 'users/"+this.data'),
  'plug/actions/user/BulkFindAction': commandModule('GET', 'users/bulk'),

  'plug/core/EventManager': function (m) {
    return _.isObject(m.eventTypeMap) && _.isObject(m.commandClassMap._map);
  },
  'plug/core/Events': function (m) {
    return _.isFunction(m.dispatch) && m.dispatch.length === 1;
  },
  'plug/core/Class': function (m) {
    return _.isFunction(m) && _.isFunction(m.extend) && functionsSeemEqual(m, function () {});
  },
  'plug/core/EventHandler': function (m) {
    return _.isFunction(m) && m.prototype &&
           _.isFunction(m.prototype.dispatch) &&
           _.isFunction(m.prototype.trigger) &&
           _.isFunction(m.prototype.execute) &&
           // this is a bit lame, unfortunately plug.dj's "classes" don't publicly store their superclasses
           functionsSeemEqual(m.prototype.execute, function () { this.event = undefined, delete this.event });
  },

  'plug/settings/settings': function (m) {
    return _.isObject(m.settings);
  },
  'plug/lang/Lang': function (m) {
    return 'alerts' in m && 'addedToPlaylist' in m.alerts;
  },

  'plug/util/analytics': function (m) {
    return _.isFunction(m.identify);
  },
  'plug/util/API': function (m) {
    return 'WAIT_LIST_UPDATE' in m && 'CHAT_COMMAND' in m ;
  },
  'plug/util/comparators': function (m) {
    return _.isFunction(m.uIndex) && _.isFunction(m.priority);
  },
  'plug/util/Dictionary': function (m) {
    return m.prototype && m.prototype._map === null && _.isFunction(m.prototype.adopt);
  },
  'plug/util/DateTime': function (m) {
    return _.isFunction(m.ServerDate);
  },
  'plug/util/emoji': function (m) {
    return _.isFunction(m.emojify) && m.map && 'shipit' in m.map;
  },
  'plug/util/Environment': function (m) {
    return 'isChrome' in m && 'isAndroid' in m;
  },
  'plug/util/Random': function (m) {
    return _.isFunction(m) && m.MASTER instanceof m && _.isFunction(m.MASTER.newSeed);
  },
  'plug/util/urls': function (m) {
    return 'csspopout' in m && 'scThumbnail' in m;
  },
  'plug/util/util': function (m) {
    return _.isFunction(m.h2t);
  },
  'plug/util/window': function (m) {
    return 'PLAYLIST_OFFSET' in m;
  },

  'plug/events/Event': eventModule('Event'),
  'plug/events/AlertEvent': eventModule('AlertEvent'),
  'plug/events/ChatFacadeEvent': eventModule('ChatFacadeEvent'),
  'plug/events/CustomRoomEvent': eventModule('CustomRoomEvent'),
  'plug/events/DJEvent': eventModule('DJEvent'),
  'plug/events/FacebookLoginEvent': eventModule('FacebookLoginEvent'),
  'plug/events/HistorySyncEvent': eventModule('HistorySyncEvent'),
  'plug/events/ImportSoundCloudEvent': eventModule('ImportSoundCloudEvent'),
  'plug/events/ImportYouTubeEvent': eventModule('ImportYouTubeEvent'),
  'plug/events/MediaActionEvent': eventModule('MediaActionEvent'),
  'plug/events/MediaDeleteEvent': eventModule('MediaDeleteEvent'),
  'plug/events/MediaGrabEvent': eventModule('MediaGrabEvent'),
  'plug/events/MediaInsertEvent': eventModule('MediaInsertEvent'),
  'plug/events/MediaMoveEvent': eventModule('MediaMoveEvent'),
  'plug/events/MediaUpdateEvent': eventModule('MediaUpdateEvent'),
  'plug/events/ModerateEvent': eventModule('ModerateEvent'),
  'plug/events/PlaylistActionEvent': eventModule('PlaylistActionEvent'),
  'plug/events/PlaylistCreateEvent': eventModule('PlaylistCreateEvent'),
  'plug/events/PlaylistDeleteEvent': eventModule('PlaylistDeleteEvent'),
  'plug/events/PlaylistRenameEvent': eventModule('PlaylistRenameEvent'),
  'plug/events/PlayMediaEvent': eventModule('PlayMediaEvent'),
  'plug/events/PreviewEvent': eventModule('PreviewEvent'),
  'plug/events/RelatedBackEvent': eventModule('RelatedBackEvent'),
  'plug/events/RestrictedSearchEvent': eventModule('RestrictedSearchEvent'),
  'plug/events/RoomCreateEvent': eventModule('RoomCreateEvent'),
  'plug/events/RoomEvent': eventModule('RoomEvent'),
  'plug/events/ShowDialogEvent': eventModule('ShowDialogEvent'),
  'plug/events/ShowUserRolloverEvent': eventModule('ShowUserRolloverEvent'),
  'plug/events/StoreEvent': eventModule('StoreEvent'),
  'plug/events/UserEvent': eventModule('UserEvent'),
  'plug/events/UserListEvent': eventModule('UserListEvent'),

  'plug/models/Avatar': function (m) {
    return m.AUDIENCE && m.DJ && _.isObject(m.IMAGES);
  },
  'plug/models/BannedUser': function (m) {
    return hasDefaults(m) && 'moderator' in m.prototype.defaults && 'duration' in m.prototype.defaults;
  },
  'plug/models/booth': function (m) {
    return 'isLocked' in m && 'shouldCycle' in m;
  },
  'plug/models/currentMedia': function (m) {
    return _.isFunction(m.onMediaChange) && _.isFunction(m.onStartTimeChange);
  },
  'plug/models/currentRoom': function (m) {
    return m instanceof Backbone.Model && _.isArray(m.get('fx'));
  },
  'plug/models/currentScore': function (m) {
    return _.isFunction(m.vote) && _.isFunction(m.grab) && _.isFunction(m.advance);
  },
  'plug/models/currentUser': function (m) {
    return _.isArray(m._l) && _.isArray(m._x);
  },
  'plug/models/HistoryEntry': function (m) {
    return hasDefaults(m) && 'timestamp' in m.prototype.defaults && 'score' in m.prototype.defaults;
  },
  'plug/models/ImportingPlaylist': function (m) {
    return hasDefaults(m) && 'title' in m.prototype.defaults && 'tracks' in m.prototype.defaults;
  },
  'plug/models/Media': function (m) {
    return hasDefaults(m) && 'cid' in m.prototype.defaults && 'format' in m.prototype.defaults;
  },
  'plug/models/MediaSearchResult': function (m) {
    return hasDefaults(m) && 'media' in m.prototype.defaults && 'playlist' in m.prototype.defaults;
  },
  'plug/models/MutedUser': function (m) {
    return hasDefaults(m) && 'moderator' in m.prototype.defaults && 'expires' in m.prototype.defaults;
  },
  'plug/models/Notification': function (m) {
    return hasDefaults(m) && 'action' in m.prototype.defaults && 'value' in m.prototype.defaults;
  },
  'plug/models/Playlist': function (m) {
    return hasDefaults(m) && 'playlistID' in m.prototype.defaults && 'username' in m.prototype.defaults;
  },
  'plug/models/Room': function (m) {
    return hasDefaults(m) && 'slug' in m.prototype.defaults && 'capacity' in m.prototype.defaults;
  },
  'plug/models/User': function (m) {
    return hasDefaults(m) && 'avatarID' in m.prototype.defaults && 'role' in m.prototype.defaults;
  },
  'plug/models/YouTubeRelatedMedia': todo,

  'plug/collections/allAvatars': function (m) {
    return m instanceof Backbone.Collection && _.isFunction(m.__generate);
  },
  'plug/collections/bannedUsers': function (m) {
    return isCollectionOf(m, require('plug/models/BannedUser'));
  },
  'plug/collections/currentPlaylistFilter': function (m) {
    return isCollectionOf(m, require('plug/models/Media')) &&
      _.isFunction(m.setFilter) && _.isFunction(m.isActualFirst);
  },
  'plug/collections/dashboardRooms': function (m) {
    if (!isCollectionOf(m, require('plug/models/Room'))) {
      return false;
    }
    var fakeRoomA = { get: function (key) { return key === 'population' ? 10 : 'a'; } },
        fakeRoomB = { get: function (key) { return key === 'population' ? 10 : 'b'; } },
        fakeRoomC = { get: function (key) { return key === 'population' ? 20 : 'c'; } };
    return functionContains(m.comparator, 'population') &&
      functionContains(m.comparator, 'name') &&
      m.comparator(fakeRoomA, fakeRoomB) === 1 &&
      m.comparator(fakeRoomC, fakeRoomB) === -1;
  },
  'plug/collections/history': function (m) {
    return m instanceof Backbone.Collection && _.isFunction(m.onPointsChange);
  },
  'plug/collections/ignores': todo,
  'plug/collections/imports': todo,
  'plug/collections/inventory': function (m) {
    return isCollectionOf(m, require('plug/models/Avatar')) && todo();
  },
  'plug/collections/mutes': function (m) {
    return isCollectionOf(m, require('plug/models/MutedUser'));
  },
  'plug/collections/notifications': function (m) {
    return isCollectionOf(m, require('plug/models/Notification'));
  },
  'plug/collections/playlists': function (m) {
    return isCollectionOf(m, require('plug/models/Playlist')) &&
      _.isFunction(m.jumpToMedia) && _.isArray(m.activeMedia);
  },
  'plug/collections/currentPlaylist': function (m) {
    return isCollectionOf(m, require('plug/models/Media')) && todo();
  },
  'plug/collections/probablySoundCloudPlaylists': todo,
  'plug/collections/purchasableAvatars': todo,
  'plug/collections/searchResults2': todo,
  'plug/collections/searchResults': todo,
  'plug/collections/staffFiltered': function (m) {
    return isCollectionOf(m, require('plug/models/User')) && _.isFunction(m.setFilter) &&
      !('sourceCollection' in m);
  },
  'plug/collections/staff': function (m) {
    return isCollectionOf(m, require('plug/models/User')) &&
      m.comparator === require('plug/util/comparators').role;
  },
  'plug/collections/unknown0': todo,
  'plug/collections/userHistory': todo,
  'plug/collections/userRooms': function (m) {
    return isCollectionOf(m, require('plug/models/Room')) && todo();
  },
  'plug/collections/usersFiltered': function (m) {
    return isCollectionOf(m, require('plug/models/User')) && _.isFunction(m.setFilter) &&
      'sourceCollection' in m;
  },
  'plug/collections/users': function (m) {
    return m instanceof Backbone.Collection && _.isFunction(m.getAudience);
  },
  'plug/collections/waitlist': function (m) {
    return m instanceof Backbone.Collection && 'isTheUserPlaying' in m;
  },

  // application views
  'plug/views/app/ApplicationView': function (m) {
    return m.prototype && m.prototype.el === 'body' && _.isFunction(m.prototype.showRoom);
  },
  'plug/views/app/AppMenuView': function (m) {
    return m.prototype && m.prototype.id === 'app-menu' && _.isFunction(m.prototype.onLogoutClick);
  },

  // dashboard
  'plug/views/dashboard/DashboardBorderView': function (m) {
    return isView(m) && m.prototype.id === 'dashboard-border';
  },
  'plug/views/dashboard/DashboardView': function (m) {
    return isView(m) && m.prototype.id === 'dashboard';
  },
  'plug/views/dashboard/SearchView': function (m) {
    return isView(m) && m.prototype.className === 'search' && _.isFunction(m.prototype.clear);
  },
  'plug/views/dashboard/TutorialView': function (m) {
    return isView(m) && m.prototype.id === 'tutorial';
  },
  'plug/views/dashboard/list/CellView': function (m) {
    return isView(m) && _.isFunction(m.prototype.onFavorite) && _.isFunction(m.prototype.onFriends);
  },
  'plug/views/dashboard/list/GridMenuView': todo,
  'plug/views/dashboard/list/TabMenuView': function (m) {
    return isView(m) && m.prototype.className === 'tab-menu' && _.isFunction(m.prototype.select);
  },
  'plug/views/dashboard/header/DashboardHeaderView': todo,
  'plug/views/dashboard/news/NewsView': function (m) {
    return isView(m) && m.prototype.id === 'news';
  },
  'plug/views/dashboard/news/NewsRowView': todo,

  // footer
  'plug/views/footer/FacebookMenuView': function (m) {
    return isView(m) && m.prototype.id === 'facebook-menu';
  },
  'plug/views/footer/FooterView': function (m) {
    return isView(m) && m.prototype.id === 'footer';
  },
  'plug/views/footer/PlaylistMetaView': function (m) {
    return isView(m) && m.prototype.id === 'playlist-meta';
  },
  'plug/views/footer/SocialMenuView': function (m) {
    return isView(m) && m.prototype.className === 'social-menu' && m.prototype.template === undefined;
  },
  'plug/views/footer/StatusMenuView': function (m) {
    return isView(m) && m.prototype.className === 'status menu';
  },
  'plug/views/footer/TwitterMenuView': function (m) {
    return isView(m) && m.prototype.id === 'twitter-menu';
  },
  'plug/views/footer/UserMenuView': function (m) {
    return isView(m) && m.prototype.className === 'user menu';
  },
  'plug/views/footer/UserMetaView': function (m) {
    return isView(m) && m.prototype.id === 'footer-user';
  },

  // spinners
  'plug/views/spinner/SpinnerView': function (m) {
    return isView(m) && 'LARGE' in m && 'MEDIUM' in m && 'SMALL' in m;
  },

  // tooltips
  'plug/views/tooltips/tooltip': function (m) {
    return m instanceof Backbone.View && m.id === 'tooltip';
  },

  // grab menu
  'plug/views/grabs/grabMenu': function (m) {
    return m instanceof Backbone.View && m.className === 'pop-menu';
  },
  'plug/views/grabs/GrabMenuRow': function (m) {
    return m.prototype && m.prototype.tagName === 'li' &&
      functionContains(m.prototype.render, 'icon-create-playlist') !== -1;
  },

  // on-screen room notifications
  'plug/views/notifications/NotificationsAreaView': function (m) {
    return isView(m) && m.prototype.id === 'toast-notifications';
  },
  'plug/views/notifications/NotificationView': function (m) {
    return isView(m) && m.prototype.className === 'notification' && _.isFunction(m.prototype.slideDown);
  },

  // dialogs
  'plug/views/dialogs/DialogContainerView': function (m) {
    return m.prototype && m.prototype.id === 'dialog-container';
  },
  'plug/views/dialogs/Dialog': function (m) {
    return m.prototype && _.isFunction(m.prototype.onContainerClick);
  },
  'plug/views/dialogs/AlertDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-alert';
  },
  // BoothLockDialog is the only dialog with a "dialog-confirm" id and a "destructive" class.
  'plug/views/dialogs/BoothLockDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-confirm' &&
      m.prototype.className.indexOf('destructive') === -1;
  },
  'plug/views/dialogs/ConfirmDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-confirm';
  },
  'plug/views/dialogs/ForceSkipDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-skip';
  },
  'plug/views/dialogs/LevelUpDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-level-up';
  },
  'plug/views/dialogs/MediaDeleteDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-delete';
  },
  'plug/views/dialogs/MediaRestrictedDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-restricted-media';
  },
  'plug/views/dialogs/MediaUpdateDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-media-update';
  },
  'plug/views/dialogs/PlaylistCreateDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-playlist-create';
  },
  'plug/views/dialogs/PlaylistDeleteDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-playlist-delete';
  },
  'plug/views/dialogs/PlaylistRenameDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-playlist-rename';
  },
  'plug/views/dialogs/PreviewDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-preview' &&
      // tutorial dialogs also have the dialog-preview ID
      m.prototype.className.indexOf('tutorial') === -1;
  },
  'plug/views/dialogs/PurchaseAvatarDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-purchase-avatar';
  },
  'plug/views/dialogs/RoomCreateDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-room-create';
  },
  'plug/views/dialogs/StaffRoleDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-user-role';
  },
  'plug/views/dialogs/TutorialDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-preview' &&
      m.prototype.className.indexOf('tutorial') !== -1;
  },
  'plug/views/dialogs/UserMuteDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-mute-user';
  },
  'plug/views/dialogs/UserBanDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-ban-user';
  },
  'plug/views/dialogs/UserRoleDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-user-role';
  },

  // playlist views
  'plug/views/playlists/PlaylistPanelView': function (m) {
    // TODO ensure that there are no other modules that match this footprint
    return isView(m) && m.prototype.id === 'playlist-panel';
  },
  'plug/views/playlists/media/MediaPanelView': function (m) {
    // TODO ensure that there are no other modules that match this footprint
    return isView(m) && m.prototype.id === 'media-panel';
  },
  'plug/views/playlists/menu/PlaylistMenuView': function (m) {
    return m instanceof Backbone.View && m.id === 'playlist-menu';
  },
  'plug/views/playlists/menu/PlaylistRowView': function (m) {
    return isView(m) && m.prototype.className === 'row' && _.isFunction(m.prototype.onSyncingChange);
  },
  'plug/views/playlists/search/SearchMenuView': function (m) {
    return isView(m) && m.prototype.id === 'search-menu' && _.isFunction(m.prototype.onYouTubeClick);
  },
  'plug/views/playlists/search/SearchSuggestionView': function (m) {
    return isView(m) && m.prototype.id === 'search-suggestion';
  },
  'plug/views/playlists/search/SearchView': function (m) {
    return isView(m) && m.prototype.id === 'search';
  },

  // user views
  'plug/views/user/userRolloverView': function (m) {
    return _.isObject(m) && m instanceof Backbone.View && m.id === 'user-rollover';
  },
  'plug/views/user/UserView': function (m) {
    return isView(m) && m.prototype.id === 'user-view';
  },

  'plug/views/user/communities/CommunitiesView': function (m) {
    return isView(m) && m.prototype.id === 'user-communities';
  },
  'plug/views/user/communities/CommunityGridView': todo,

  'plug/views/user/profile/ExperienceView': function (m) {
    return isView(m) && m.prototype.className === 'experience section';
  },
  'plug/views/user/profile/MetaView': function (m) {
    return isView(m) && m.prototype.className === 'meta section';
  },
  'plug/views/user/profile/NotificationsView': function (m) {
    return isView(m) && m.prototype.className === 'notifications section';
  },
  'plug/views/user/profile/NotificationView': todo,
  'plug/views/user/profile/PointsView': function (m) {
    return isView(m) && m.prototype.className === 'points';
  },
  // Current User Profile,
  'plug/views/user/profile/ProfileView': function (m) {
    return isView(m) && m.prototype.id === 'the-user-profile';
  },
  // Other user profiles? (On the profile pages?)
  'plug/views/user/profile/UnusedProfileView': function (m) {
    return isView(m) && m.prototype.id === 'user-profile';
  },

  'plug/views/user/menu/UserMenuView': function (m) {
    return isView(m) && m.prototype.id === 'user-menu';
  },

  'plug/views/user/history/UserHistoryView': function (m) {
    return isView(m) && m.prototype.id === 'user-history';
  },

  'plug/views/user/settings/SettingsView': function (m) {
    return isView(m) && m.prototype.id === 'user-settings';
  },
  // there's a bunch of different TabMenuViews, this one is only different from the rest in the methods it lacks
  'plug/views/user/settings/TabMenuView': function (m) {
    return m.prototype && m.prototype.className === 'tab-menu' &&
      !('selectStore' in m.prototype) && !('select' in m.prototype) && !('selectRequests' in m.prototype);
  },
  'plug/views/user/settings/SettingsApplicationView': function (m) {
    return m.prototype && m.prototype.className === 'application section';
  },
  'plug/views/user/settings/SettingsAccountView': function (m) {
    return m.prototype && m.prototype.className === 'account section';
  },
  'plug/views/rooms/audienceView': function (m) {
    return m instanceof Backbone.View && m.id === 'audience';
  },
  'plug/views/rooms/roomLoaderView': function (m) {
    return m instanceof Backbone.View && m.id === 'room-loader';
  },
  'plug/views/rooms/boothView': function (m) {
    return m instanceof Backbone.View && m.id === 'dj-booth';
  },
  'plug/views/rooms/DJButtonView': function (m) {
    return isView(m) && m.prototype.id === 'dj-button';
  },
  'plug/views/rooms/RoomView': function (m) {
    return isView(m) && m.prototype.id === 'room';
  },
  'plug/views/rooms/VotePanelView': function (m) {
    return isView(m) && m.prototype.id === 'vote';
  },
  'plug/views/rooms/playback/PlaybackView': function (m) {
    return isView(m) && m.prototype.id === 'playback';
  },
  'plug/views/rooms/playback/VolumeView': function (m) {
    return isView(m) && m.prototype.id === 'volume';
  },
  'plug/views/rooms/users/RoomUserRowView': function (m) {
    return _.isFunction(m) && _.isFunction(m.prototype.vote);
  },
  'plug/views/rooms/chat/ChatView': function (m) {
    return isView(m) && m.prototype.id === 'chat';
  },
  'plug/views/rooms/chat/ChatSuggestionView': function (m) {
    return isView(m) && m.prototype.id === 'chat-suggestion';
  },
  'plug/views/rooms/popout/PopoutChatSuggestionView': function (m) {
    // subclass of ChatSuggestionView with no additional properties
    return isView(m) && m.__super__ && m.__super__.id === 'chat-suggestion';
  },
  'plug/views/rooms/popout/PopoutChatView': function (m) {
    // subclass of ChatView
    return isView(m) && m.__super__ && m.__super__.id === 'chat';
  },
  'plug/views/rooms/popout/PopoutMetaView': function (m) {
    return isView(m) && m.prototype.id === 'meta';
  },
  'plug/views/rooms/popout/PopoutView': function (m) {
    return isView(m) && functionContains(m.prototype.show, 'plugdjpopout');
  },
  'plug/views/rooms/popout/PopoutVoteView': function (m) {
    // subclass of VotePanelView
    return isView(m) && m.__super__ && m.__super__.id === 'vote';
  },

};

_.each(plugModules, function (filter, name) {
  setDefine(name, plugRequire(filter));
});
;    require([ 'extplug/ExtPlug' ], function (ExtPlug) {

      var cbs = window.extp || [];
      var ext = new ExtPlug();
      window.extp = ext;

      ext.init();
      cbs.forEach(function (cb) {
        cb(ext);
      });

    });
  }
  else {
    setTimeout(_initExtPlug, 20);
  }

}());