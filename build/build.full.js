;(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define('plug-modules',factory);
  }
  else if (typeof module === 'object' && module.exports) {
    module.exports = factory()
  }
  else {
    // Browser globals
    root.plugModules = factory();
  }
}(this, function () {

// Tests if an object is a Backbone collection of a certain type of Model.
var isCollectionOf = function (m, Model) {
  return Model && m instanceof Backbone.Collection && m.model === Model;
};

// Checks if the given module is a plug.dj Dialog view class.
var isDialog = function (m) {
  return m.prototype && m.prototype.className && m.prototype.className.indexOf('dialog') !== -1;
};

// Checks if two functions are "kind of similar" by comparing their source.
var functionsSeemEqual = function (a, b) {
  // ignore whitespace
  return (a + '').replace(/\s/g, '') === (b + '').replace(/\s/g, '');
};

// Checks if a function's source contains a given string.
var functionContains = function (fn, match) {
  return _.isFunction(fn) && fn.toString().indexOf(match) !== -1;
};

// Checks if a given object looks like a Backbone View class.
var isView = function (m) {
  return m.prototype && _.isFunction(m.prototype.render) && _.isFunction(m.prototype.$);
};

// Checks if a given Backbone Model class has a defaults property (plug.dj models).
var hasDefaults = function (m) {
  return m.prototype && m.prototype.defaults;
};

// Checks if an object has some set of attributes (Backbone models).
var hasAttributes = function (m, attributes) {
  return m instanceof Backbone.Model && attributes.every(function (attr) {
    return attr in m.attributes;
  })
};

// Checks if a View template contains an element matching a given CSS selector.
var viewHasElement = function (View, sel) {
  var stubEl = $('<div>');
  try {
    var x = new View({ el: stubEl });
    x.render();
    var has = x.$(sel).length > 0;
    x.remove();
    return has;
  }
  catch (e) {
    return false;
  }
};

// A stub matcher function, matching nothing, for modules that can not yet be matched uniquely.
var todo = function () {
  return false;
};

/**
 * The Context keeps track of the long names, and provides some convenience methods
 * for working with renamed modules.
 */
function Context() {
  this._nameMapping = {};
  this._notFound = [];
  this._detectives = [];
  this._ran = false;
}
// adds a Detective to this context. these detectives will
// be run by Context#run.
Context.prototype.add = function (name, detective) {
  this._detectives.push({ name: name, detective: detective });
  return this;
};
// runs all known detectives.
Context.prototype.run = function () {
  if (this._ran) {
    return this;
  }
  var detectives = this._detectives.slice();
  // < 5000 to prevent an infinite loop if a detective's dependency was not found.
  for (var i = 0; i < detectives.length && i < 5000; i++) {
    var current = detectives[i];
    if (current.detective.isReady(this)) {
      current.detective.run(this, current.name);
    }
    else {
      // revisit later.
      detectives.push(current);
    }
  }

  this._ran = true;
  return this;
};
Context.prototype.resolveName = function (path) {
  return this._nameMapping[path] ? this.resolveName(this._nameMapping[path]) : path;
};
Context.prototype.require = function (path) {
  var defined = require.s.contexts._.defined;
  return defined[path] || (this._nameMapping[path] && this.require(this._nameMapping[path])) || undefined;
};
Context.prototype.isDefined = function (path) {
  return typeof this.require(path) !== 'undefined';
};
Context.prototype.define = function (newPath, oldPath) {
  this._nameMapping[newPath] = oldPath;
  return this;
};
Context.prototype.setNotFound = function (path) {
  this._notFound.push(path);
};
Context.prototype.getUnknownModules = function () {
  var knownModules = _.values(this._nameMapping);
  var allModules = _.keys(require.s.contexts._.defined).filter(function (moduleName) {
    return moduleName.substr(0, 5) !== 'plug/' &&
      moduleName.substr(0, 4) !== 'hbs!' &&
      this.require(moduleName) !== undefined;
  }, this);

  return _.difference(allModules, knownModules);
};
Context.prototype.isInSameNamespace = function (name, otherModuleName) {
  var otherName = this.resolveName(otherModuleName);
  return otherName && otherName.substr(0, otherName.lastIndexOf('/')) === name.substr(0, name.lastIndexOf('/'));
};
// Add the new names to the global module registry
Context.prototype.register = function () {
  for (var newName in this._nameMapping) if (this._nameMapping.hasOwnProperty(newName)) {
    require.s.contexts._.defined[newName] = this.require(newName);
  }
};

/**
 * A Detective finds a specific module definition.
 */
function Detective() {
  this._needs = [];
}
// Define dependencies. This ensures that this Detective will only run
// once the given modules have been found.
Detective.prototype.needs = function () {
  this._needs = this._needs.concat(Array.prototype.slice.call(arguments));
  return this;
};
Detective.prototype.isReady = function (context) {
  return this._needs.every(function (name) {
    return context.isDefined(name);
  });
};
Detective.prototype.resolve = function () {
  throw new Error('Engineer "resolve" method not implemented');
};
Detective.prototype.run = function (context, newName) {
  var oldName = this.resolve(context);
  if (oldName) {
    context.define(newName, oldName);
    return true;
  }
  context.setNotFound(newName);
  return false;
};

/**
 * A Matcher finds a module definition by checking every available
 * module definition until it matches.
 */
function Matcher() {
  Detective.call(this);
}
Matcher.prototype = Object.create(Detective.prototype);
Matcher.prototype.match = function (context, module, name) {
  throw new Error('Matcher "match" method not implemented');
};
Matcher.prototype.resolve = function (context) {
  var defines = require.s.contexts._.defined;
  var fn = this.fn;
  for (var name in defines) if (defines.hasOwnProperty(name)) {
    if (defines[name] && this.match(context, defines[name], name)) {
      return name;
    }
  }
};
Matcher.prototype.and = function (matcher) {
  if (!(matcher instanceof Matcher)) {
    matcher = new SimpleMatcher(matcher);
  }
  return new AndMatcher(this, matcher);
};

/**
 * A Fetcher finds a module definition by itself. Usually it will use other, known, modules
 * and "navigate" to a place that references target module.
 */
function Fetcher() {
  Detective.call(this);
}
Fetcher.prototype = Object.create(Detective.prototype);
Fetcher.prototype.resolve = function (context) {
  var module = this.fetch(context);
  if (module) {
    // find module name
    var defines = require.s.contexts._.defined,
      name;
    for (name in defines) if (defines.hasOwnProperty(name)) {
      if (defines[name] && defines[name] === module) {
        return name;
      }
    }
  }
}

/**
 * A SimpleMatcher finds a module definition that matches a function.
 */
function SimpleMatcher(fn) {
  Matcher.call(this);

  this._fn = fn;
}
SimpleMatcher.prototype = Object.create(Matcher.prototype);
SimpleMatcher.prototype.match = function (context, module, name) {
  if (!this._fn) {
    throw new Error('No function passed to SimpleMatcher.');
  }
  return this._fn.call(context, module, name);
};

/**
 * A StepwiseMatcher finds a module definition that matches a function.
 * Some setup and cleanup can be done around the matcher, for example
 * to set up some mutations that you can use to detect the right definition.
 */
function StepwiseMatcher(steps) {
  SimpleMatcher.call(this, steps.check);

  this._setup = steps.setup;
  this._cleanup = steps.cleanup;
}
StepwiseMatcher.prototype = Object.create(SimpleMatcher.prototype);
StepwiseMatcher.prototype.resolve = function (context) {
  // step 1: setup
  this._setup.call(context);
  // step 2: run checks
  var name = SimpleMatcher.prototype.resolve.call(this, context);
  // step 3: cleanup
  this._cleanup.call(context, context.require(name), name);
  return name;
};

/**
 * An AndMatcher finds a module definition that matches two other Matchers.
 */
function AndMatcher(a, b) {
  Matcher.call(this);

  if (a._needs) this.needs.apply(this, a._needs);
  if (b._needs) this.needs.apply(this, b._needs);

  this.a = a;
  this.b = b;
}
AndMatcher.prototype = Object.create(Matcher.prototype);
AndMatcher.prototype.match = function (context, module, name) {
  return this.a.match(context, module, name) && this.b.match(context, module, name);
};

/**
 * An EventMatcher finds a module definition for a specific kind of Event.
 */
function EventMatcher(name) {
  Matcher.call(this);

  this._name = name;
}
EventMatcher.prototype = Object.create(Matcher.prototype);
EventMatcher.prototype.match = function (context, module, name) {
  return module._name === this._name;
};

/**
 * An ActionMatcher finds a module definition that defines a certain plug.dj Action.
 */
function ActionMatcher(method, url) {
  Matcher.call(this);

  this._method = method.toUpperCase();
  this._url = url;
}
ActionMatcher.prototype = Object.create(Matcher.prototype);
ActionMatcher.prototype.match = function (context, module, name) {
  return module.prototype &&
    functionContains(module.prototype.execute, '.execute("' + this._method) &&
    functionContains(module.prototype.execute, this._url);
};

/**
 * A SimpleFetcher allows a given function to find a module definition.
 */
function SimpleFetcher(fn) {
  Detective.call(this);

  this._fetch = fn;
}
SimpleFetcher.prototype = Object.create(Fetcher.prototype);
SimpleFetcher.prototype.fetch = function (context) {
  return this._fetch.call(context);
};

/**
 * A HandlerFetcher finds a module definition of a plug.dj Event Handler that handles a specific event.
 */
function HandlerFetcher(eventName) {
  Detective.call(this);

  this._eventName = eventName;
  this.needs('plug/core/EventManager');
}
HandlerFetcher.prototype = Object.create(Fetcher.prototype);
HandlerFetcher.prototype.fetch = function (context) {
  var events = context.require('plug/core/EventManager').eventTypeMap;
  if (!events) return false;
  var eventTypes = events[this._eventName];
  // Luckily for us, none of the events have multiple handlers at the moment!
  return eventTypes && eventTypes[0];
};

/**
 * Map improvised module name → module matcher. (that hopefully matches only the right module!)
 * This is quite brittle because Plug.DJ can change their internals at any given moment, but
 * it sort of works!
 */
var plugModules = {

  'plug/actions/Action': function (m) {
    return m.prototype && _.isFunction(m.prototype.alert) && _.isFunction(m.prototype.permissionAlert);
  },
  'plug/actions/actionQueue': function (m) {
    return _.isArray(m.queue) && _.isFunction(m.add) && _.isFunction(m.append) &&
      _.isFunction(m.next) && _.isFunction(m.complete);
  },

  'plug/actions/auth/AuthResetAction': new ActionMatcher('POST', 'auth/reset/me'),
  'plug/actions/auth/AuthTokenAction': new ActionMatcher('GET', 'auth/token'),
  'plug/actions/auth/FacebookAuthAction': new ActionMatcher('POST', 'auth/facebook'),
  'plug/actions/auth/KillSessionAction': new ActionMatcher('DELETE', 'auth/session'),
  'plug/actions/bans/BanAction': new ActionMatcher('POST', 'bans/add'),
  'plug/actions/bans/ListBansAction': new ActionMatcher('GET', 'bans'),
  'plug/actions/bans/UnbanAction': new ActionMatcher('DELETE', 'bans/'),
  'plug/actions/booth/JoinWaitlistAction': new ActionMatcher('POST', 'booth'),
  'plug/actions/booth/LeaveWaitlistAction': new ActionMatcher('DELETE', 'booth'),
  'plug/actions/booth/ModerateAddDJAction': new ActionMatcher('POST', 'booth/add'),
  'plug/actions/booth/ModerateForceSkipAction': new ActionMatcher('POST', 'booth/skip"'),
  'plug/actions/booth/ModerateRemoveDJAction': new ActionMatcher('DELETE', 'booth/remove/'),
  'plug/actions/booth/SkipTurnAction': new ActionMatcher('POST', 'booth/skip/me'),
  'plug/actions/booth/BoothLockAction': new ActionMatcher('PUT', 'booth/lock'),
  'plug/actions/booth/BoothMoveAction': new ActionMatcher('POST', 'booth/move'),
  'plug/actions/booth/BoothSetCycleAction': new ActionMatcher('PUT', 'booth/cycle'),
  'plug/actions/friends/BefriendAction': new ActionMatcher('POST', 'friends'),
  'plug/actions/friends/ListFriendsAction': new ActionMatcher('GET', 'friends"'),
  'plug/actions/friends/ListInvitesAction': new ActionMatcher('GET', 'friends/invites'),
  'plug/actions/friends/IgnoreRequestAction': new ActionMatcher('PUT', 'friends/ignore'),
  'plug/actions/friends/UnfriendAction': new ActionMatcher('DELETE', 'friends/'),
  'plug/actions/ignores/IgnoreAction': new ActionMatcher('POST', 'ignores'),
  'plug/actions/ignores/UnignoreAction': new ActionMatcher('DELETE', 'ignores/'),
  'plug/actions/ignores/IgnoresListAction': new ActionMatcher('GET', 'ignores'),
  'plug/actions/media/ListMediaAction': new ActionMatcher('GET', 'playlists/'),
  'plug/actions/media/MediaDeleteAction': new ActionMatcher('POST', 'playlists/"+this.id+"/media/delete'),
  'plug/actions/media/MediaGrabAction': new ActionMatcher('POST', 'grabs'),
  'plug/actions/media/MediaInsertAction': new ActionMatcher('POST', 'playlists/"+this.id+"/media/insert'),
  'plug/actions/media/MediaMoveAction': new ActionMatcher('PUT', 'playlists/"+this.id+"/media/move'),
  'plug/actions/media/MediaUpdateAction': new ActionMatcher('PUT', 'playlists/"+this.id+"/media/update'),
  'plug/actions/media/SearchPlaylistsAction': new ActionMatcher('GET', 'playlists/media?q='),
  'plug/actions/mutes/MuteAction': new ActionMatcher('POST', 'mutes'),
  'plug/actions/mutes/UnmuteAction': new ActionMatcher('DELETE', 'mutes/'),
  'plug/actions/mutes/MutesListAction': new ActionMatcher('GET', 'mutes'),
  'plug/actions/news/NewsListAction': new ActionMatcher('GET', 'news'),
  'plug/actions/notifications/NotificationReadAction': new ActionMatcher('DELETE', 'notifications/'),
  'plug/actions/playlists/ListPlaylistsAction': new ActionMatcher('GET', 'playlists'),
  'plug/actions/playlists/PlaylistActivateAction': new ActionMatcher('PUT', 'playlists/"+this.data+"/activate'),
  'plug/actions/playlists/PlaylistCreateAction': new ActionMatcher('POST', 'playlists"'),
  'plug/actions/playlists/PlaylistDeleteAction': new ActionMatcher('DELETE', 'playlists/'),
  'plug/actions/playlists/PlaylistRenameAction': new ActionMatcher('PUT', 'playlists/"+this.id+"/rename'),
  'plug/actions/playlists/PlaylistShuffleAction': new ActionMatcher('PUT', 'playlists/"+this.data+"/shuffle'),
  'plug/actions/profile/SetBlurbAction': new ActionMatcher('PUT', 'profile/blurb'),
  'plug/actions/rooms/ListFavoritesAction': new ActionMatcher('GET', 'rooms/favorites'),
  'plug/actions/rooms/ListMyRoomsAction': new ActionMatcher('GET', 'rooms/me'),
  'plug/actions/rooms/ListRoomsAction': new ActionMatcher('GET', 'rooms"'),
  'plug/actions/rooms/ModerateDeleteChatAction': new ActionMatcher('DELETE', 'chat/"+this.data'),
  'plug/actions/rooms/RoomCreateAction': new ActionMatcher('POST', 'rooms'),
  'plug/actions/rooms/RoomFavoriteAction': new ActionMatcher('POST', 'rooms/favorites'),
  'plug/actions/rooms/RoomHistoryAction': new ActionMatcher('GET', 'rooms/history'),
  'plug/actions/rooms/RoomJoinAction': new ActionMatcher('POST', 'rooms/join'),
  'plug/actions/rooms/RoomStateAction': new ActionMatcher('GET', 'rooms/state'),
  'plug/actions/rooms/RoomUnfavoriteAction': new ActionMatcher('DELETE', 'rooms/favorites'),
  'plug/actions/rooms/RoomUpdateAction': new ActionMatcher('POST', 'rooms/update'),
  'plug/actions/rooms/RoomValidateAction': new ActionMatcher('GET', 'rooms/validate'),
  'plug/actions/rooms/VoteAction': new ActionMatcher('POST', 'votes'),
  'plug/actions/soundcloud/SoundCloudSearchService': function (m) {
    return _.isFunction(m) && _.isFunction(m.prototype.onResolve) && _.isFunction(m.prototype.parse);
  },
  'plug/actions/soundcloud/SoundCloudFavoritesService': function (m) {
    return _.isFunction(m) && _.isFunction(m.prototype.auth) &&
      functionContains(m.prototype.load, '/me/favorites');
  },
  'plug/actions/soundcloud/SoundCloudTracksService': function (m) {
    return _.isFunction(m) && _.isFunction(m.prototype.auth) &&
      functionContains(m.prototype.load, '/me/tracks');
  },
  'plug/actions/soundcloud/SoundCloudSetsService': function (m) {
    return _.isFunction(m) && _.isFunction(m.prototype.auth) &&
      functionContains(m.prototype.load, '/me/playlists');
  },
  'plug/actions/soundcloud/SoundCloudPermalinkService': function (m) {
    return _.isFunction(m) && functionContains(m.prototype.load, 'api.soundcloud.com/tracks') &&
      !functionContains(m.prototype.onError, 'Search') &&
      _.isFunction(m.prototype.onComplete);
  },
  'plug/actions/staff/StaffListAction': new ActionMatcher('GET', 'staff'),
  'plug/actions/staff/StaffRemoveAction': new ActionMatcher('DELETE', 'staff/'),
  'plug/actions/staff/StaffUpdateAction': new ActionMatcher('POST', 'staff/update'),
  'plug/actions/store/ChangeUsernameAction': new ActionMatcher('POST', 'store/purchase/username'),
  'plug/actions/store/PurchaseAction': new ActionMatcher('POST', 'store/purchase'),
  'plug/actions/store/ProductsAction': new ActionMatcher('GET', 'store/products'),
  'plug/actions/store/InventoryAction': new ActionMatcher('GET', 'store/inventory'),
  'plug/actions/users/ValidateNameAction': new ActionMatcher('GET', 'users/validate/'),
  'plug/actions/users/SetLanguageAction': new ActionMatcher('PUT', 'users/language'),
  'plug/actions/users/SetAvatarAction': new ActionMatcher('PUT', 'users/avatar'),
  'plug/actions/users/SetBadgeAction': new ActionMatcher('PUT', 'users/badge'),
  'plug/actions/users/MeAction': new ActionMatcher('GET', '"users/me"'),
  'plug/actions/users/ListTransactionsAction': new ActionMatcher('GET', 'users/me/transactions'),
  'plug/actions/users/UserHistoryAction': new ActionMatcher('GET', 'users/me/history'),
  'plug/actions/users/UserFindAction': new ActionMatcher('GET', 'users/"+this.data'),
  'plug/actions/users/BulkFindAction': new ActionMatcher('POST', 'users/bulk'),
  'plug/actions/users/SendGiftAction': new ActionMatcher('POST', 'gift'),
  'plug/actions/users/SaveSettingsAction': new ActionMatcher('PUT', 'users/settings'),
  'plug/actions/youtube/YouTubePlaylistService': function (m) {
    return _.isFunction(m) && _.isFunction(m.prototype.sortByName) && _.isFunction(m.prototype.next);
  },
  'plug/actions/youtube/YouTubeImportService': function (m) {
    return _.isFunction(m) && _.isFunction(m.prototype.getURL) && _.isFunction(m.prototype.next);
  },
  'plug/actions/youtube/YouTubeSearchService': function (m) {
    return _.isFunction(m) && functionContains(m.prototype.load, 'paid-content=false');
  },
  'plug/actions/youtube/YouTubeSuggestService': function (m) {
    return _.isFunction(m) && functionContains(m.prototype.load, 'google.com/complete/search');
  },

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
  'plug/core/__unknown0__': function (m) {
    // subclass of EventHandler
    return _.isFunction(m) && m.prototype.hasOwnProperty('listenTo') && m.prototype.hasOwnProperty('finish');
  },

  'plug/store/settings': function (m) {
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
  'plug/util/audienceGrid': function (m) {
    return _.isFunction(m.defaultInvalidation) && _.isFunction(m.invalidateRoomElements);
  },
  'plug/util/AvatarManifest': function (m) {
    return _.isFunction(m.getAvatarUrl) && _.isFunction(m.getHitSlot);
  },
  'plug/util/comparators': function (m) {
    return _.isFunction(m.uIndex) && _.isFunction(m.priority);
  },
  'plug/util/DateTime': function (m) {
    return _.isFunction(m.ServerDate);
  },
  'plug/util/Dictionary': function (m) {
    return m.prototype && m.prototype._map === null && _.isFunction(m.prototype.adopt);
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
  'plug/util/soundCloudSdkLoader': function (m) {
    return _.isFunction(m.g) && _.isString(m.id);
  },
  'plug/util/twitterWidgetLoader': function (m) {
    return m.f && _.isFunction(m.i);
  },
  'plug/util/urls': function (m) {
    return 'csspopout' in m && 'scThumbnail' in m;
  },
  'plug/util/userSuggestion': function (m) {
    return _.isArray(m.groups) && _.isFunction(m.initGroups) && _.isFunction(m.lookup);
  },
  'plug/util/util': function (m) {
    return _.isFunction(m.h2t);
  },
  'plug/util/window': function (m) {
    return 'PLAYLIST_OFFSET' in m;
  },

  'plug/server/request': function (m) {
    return !_.isFunction(m) && _.isFunction(m.execute) &&
      functionContains(m.execute, 'application/json');
  },
  'plug/server/socketReceiver': function (m) {
    return _.isFunction(m.ack) && _.isFunction(m.plugUpdate);
  },

  'plug/events/Event': new EventMatcher('Event'),
  'plug/events/AlertEvent': new EventMatcher('AlertEvent'),
  'plug/events/ChatFacadeEvent': new EventMatcher('ChatFacadeEvent'),
  'plug/events/CustomRoomEvent': new EventMatcher('CustomRoomEvent'),
  'plug/events/DJEvent': new EventMatcher('DJEvent'),
  'plug/events/FacebookLoginEvent': new EventMatcher('FacebookLoginEvent'),
  'plug/events/FriendEvent': new EventMatcher('UserEvent').and(function (m) {
    return m.ACCEPT === 'UserEvent:accept' && m.UNFRIEND === 'UserEvent:unfriend';
  }),
  'plug/events/HistorySyncEvent': new EventMatcher('HistorySyncEvent'),
  'plug/events/ImportSoundCloudEvent': new EventMatcher('ImportSoundCloudEvent'),
  'plug/events/ImportYouTubeEvent': new EventMatcher('ImportYouTubeEvent'),
  'plug/events/MediaActionEvent': new EventMatcher('MediaActionEvent'),
  'plug/events/MediaDeleteEvent': new EventMatcher('MediaDeleteEvent'),
  'plug/events/MediaGrabEvent': new EventMatcher('MediaGrabEvent'),
  'plug/events/MediaInsertEvent': new EventMatcher('MediaInsertEvent'),
  'plug/events/MediaMoveEvent': new EventMatcher('MediaMoveEvent'),
  'plug/events/MediaUpdateEvent': new EventMatcher('MediaUpdateEvent'),
  'plug/events/ModerateEvent': new EventMatcher('ModerateEvent'),
  'plug/events/PlaylistActionEvent': new EventMatcher('PlaylistActionEvent'),
  'plug/events/PlaylistCreateEvent': new EventMatcher('PlaylistCreateEvent'),
  'plug/events/PlaylistDeleteEvent': new EventMatcher('PlaylistDeleteEvent'),
  'plug/events/PlaylistRenameEvent': new EventMatcher('PlaylistRenameEvent'),
  'plug/events/PlayMediaEvent': new EventMatcher('PlayMediaEvent'),
  'plug/events/PreviewEvent': new EventMatcher('PreviewEvent'),
  'plug/events/RelatedBackEvent': new EventMatcher('RelatedBackEvent'),
  'plug/events/RestrictedSearchEvent': new EventMatcher('RestrictedSearchEvent'),
  'plug/events/RoomCreateEvent': new EventMatcher('RoomCreateEvent'),
  'plug/events/RoomEvent': new EventMatcher('RoomEvent'),
  'plug/events/ShowDialogEvent': new EventMatcher('ShowDialogEvent'),
  'plug/events/ShowUserRolloverEvent': new EventMatcher('ShowUserRolloverEvent'),
  'plug/events/StoreEvent': new EventMatcher('StoreEvent'),
  'plug/events/UserEvent': new EventMatcher('UserEvent').and(function (m) {
    return m.FRIENDS === 'UserEvent:friends' && m.PRESENCE === 'UserEvent:presence';
  }),
  'plug/events/UserListEvent': new EventMatcher('UserListEvent'),

  'plug/handlers/AlertHandler': new HandlerFetcher('AlertEvent:alert'),
  'plug/handlers/AvatarPurchaseHandler': new HandlerFetcher('StoreEvent:purchaseAvatar'),
  'plug/handlers/BadgePurchaseHandler': new HandlerFetcher('StoreEvent:purchaseBadge'),
  'plug/handlers/BoostPurchaseHandler': new HandlerFetcher('StoreEvent:purchaseBoost'),
  'plug/handlers/CustomRoomHandler': new HandlerFetcher('CustomRoomEvent:custom'),
  'plug/handlers/DJHandler': new HandlerFetcher('DJEvent:join'),
  'plug/handlers/FacebookLoginHandler': new HandlerFetcher('FacebookLoginEvent:login'),
  'plug/handlers/FriendHandler': new HandlerFetcher('UserEvent:accept'),
  'plug/handlers/GrabHandler': new HandlerFetcher('MediaGrabEvent:grab'),
  'plug/handlers/ImportSoundCloudHandler': new HandlerFetcher('ImportSoundCloudEvent:sets'),
  'plug/handlers/ImportYouTubeHandler': new HandlerFetcher('ImportYouTubeEvent:import'),
  'plug/handlers/ListBansHandler': new HandlerFetcher('UserListEvent:bans'),
  'plug/handlers/ListFriendsHandler': new HandlerFetcher('UserEvent:friends'),
  'plug/handlers/ListIgnoresHandler': new HandlerFetcher('UserListEvent:ignored'),
  'plug/handlers/ListInvitesHandler': new HandlerFetcher('UserEvent:invites'),
  'plug/handlers/ListMutesHandler': new HandlerFetcher('UserListEvent:mutes'),
  'plug/handlers/ListPlaylistsHandler': new HandlerFetcher('PlaylistActionEvent:sync'),
  'plug/handlers/ListStaffHandler': new HandlerFetcher('UserListEvent:staff'),
  'plug/handlers/MediaDeleteHandler': new HandlerFetcher('MediaDeleteEvent:delete'),
  'plug/handlers/MediaHandler': new HandlerFetcher('MediaActionEvent:add'),
  'plug/handlers/MediaInsertHandler': new HandlerFetcher('MediaInsertEvent:insert'),
  'plug/handlers/MediaMoveHandler': new HandlerFetcher('MediaMoveEvent:move'),
  'plug/handlers/MediaPlayHandler': new HandlerFetcher('PlayMediaEvent:play'),
  'plug/handlers/MediaUpdateHandler': new HandlerFetcher('MediaUpdateEvent:update'),
  'plug/handlers/ModerateHandler': new HandlerFetcher('ModerateEvent:skip'),
  'plug/handlers/NameChangeHandler': new HandlerFetcher('StoreEvent:purchaseName'),
  'plug/handlers/PlaylistActivateHandler': new HandlerFetcher('PlaylistActionEvent:activate'),
  'plug/handlers/PlaylistCreateHandler': new HandlerFetcher('PlaylistCreateEvent:create'),
  'plug/handlers/PlaylistDeleteHandler': new HandlerFetcher('PlaylistDeleteEvent:delete'),
  'plug/handlers/PlaylistLoadHandler': new HandlerFetcher('PlaylistActionEvent:load'),
  'plug/handlers/PlaylistRenameHandler': new HandlerFetcher('PlaylistRenameEvent:rename'),
  'plug/handlers/PlaylistUpdateHandler': new HandlerFetcher('PlaylistActionEvent:rename'),
  'plug/handlers/PreviewHandler': new HandlerFetcher('PreviewEvent:preview'),
  'plug/handlers/RelatedBackHandler': new HandlerFetcher('RelatedBackEvent:back'),
  'plug/handlers/RestrictedSearchHandler': new HandlerFetcher('RestrictedSearchEvent:search'),
  'plug/handlers/RoomCreateHandler': new HandlerFetcher('RoomCreateEvent:create'),
  'plug/handlers/RoomHistoryHandler': new HandlerFetcher('HistorySyncEvent:room'),
  'plug/handlers/RoomJoinHandler': new HandlerFetcher('RoomEvent:join'),
  'plug/handlers/RoomStateHandler': new HandlerFetcher('RoomEvent:state'),
  'plug/handlers/StoreAvatarsHandler': new HandlerFetcher('StoreEvent:storeAvatars'),
  'plug/handlers/StoreBadgesHandler': new HandlerFetcher('StoreEvent:storeBadges'),
  'plug/handlers/StoreMiscHandler': new HandlerFetcher('StoreEvent:storeMisc'),
  'plug/handlers/StoreTransactionsHandler': new HandlerFetcher('StoreEvent:userTransactions'),
  'plug/handlers/UnbanHandler': new HandlerFetcher('ModerateEvent:unban'),
  'plug/handlers/UnmuteHandler': new HandlerFetcher('ModerateEvent:unmute'),
  'plug/handlers/UserAvatarsHandler': new HandlerFetcher('StoreEvent:userAvatars'),
  'plug/handlers/UserBadgesHandler': new HandlerFetcher('StoreEvent:userBadges'),
  'plug/handlers/UserHistoryHandler': new HandlerFetcher('HistorySyncEvent:user'),
  'plug/handlers/UserMeHandler': new HandlerFetcher('UserEvent:me'),
  'plug/handlers/UserRolloverHandler': new HandlerFetcher('ShowUserRolloverEvent:show'),

  'plug/models/Avatar': function (m) {
    return m.AUDIENCE && m.DJ && _.isObject(m.IMAGES);
  },
  'plug/models/Badge': function (m) {
    return hasDefaults(m) && 'level' in m.prototype.defaults && 'name' in m.prototype.defaults &&
      !('category' in m.prototype.defaults) && 'active' in m.prototype.defaults;
  },
  'plug/models/BannedUser': function (m) {
    return hasDefaults(m) && 'moderator' in m.prototype.defaults && 'duration' in m.prototype.defaults;
  },
  'plug/models/booth': function (m) {
    return hasAttributes(m, [ 'isLocked', 'shouldCycle' ]);
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
    return hasDefaults(m) && 'active' in m.prototype.defaults && 'syncing' in m.prototype.defaults;
  },
  'plug/models/Room': function (m) {
    return hasDefaults(m) && 'slug' in m.prototype.defaults && 'capacity' in m.prototype.defaults;
  },
  'plug/models/SoundCloudPlaylist': function (m) {
    return hasDefaults(m) && 'title' in m.prototype.defaults && 'tracks' in m.prototype.defaults;
  },
  'plug/models/StoreExtra': function (m) {
    return hasDefaults(m) && 'category' in m.prototype.defaults && 'name' in m.prototype.defaults &&
      !('active' in m.prototype.defaults);
  },
  'plug/models/Transaction': function (m) {
    return hasDefaults(m) && 'type' in m.prototype.defaults && 'item' in m.prototype.defaults;
  },
  'plug/models/User': function (m) {
    return hasDefaults(m) && 'avatarID' in m.prototype.defaults && 'role' in m.prototype.defaults;
  },
  'plug/models/YouTubePlaylist': function (m) {
    return hasDefaults(m) && 'playlistID' in m.prototype.defaults && 'username' in m.prototype.defaults;
  },
  'plug/models/relatedSearch': function (m) {
    return hasAttributes(m, [ 'related', 'relatedPlaylist' ]);
  },

  'plug/collections/allAvatars': function (m) {
    return m instanceof Backbone.Collection && _.isFunction(m.__generate);
  },
  'plug/collections/bannedUsers': new SimpleMatcher(function (m) {
    return isCollectionOf(m, this.require('plug/models/BannedUser'));
  }).needs('plug/models/BannedUser'),
  'plug/collections/currentPlaylist': new SimpleMatcher(function (m) {
    return isCollectionOf(m, this.require('plug/models/Media')) &&
      m._events && 'update:next' in m._events;
  }).needs('plug/models/Media'),
  'plug/collections/currentPlaylistFiltered': new SimpleMatcher(function (m) {
    return isCollectionOf(m, this.require('plug/models/Media')) &&
      _.isFunction(m.setFilter) && _.isFunction(m.isActualFirst);
  }).needs('plug/models/Media'),
  'plug/collections/dashboardRooms': new SimpleMatcher(function (m) {
    if (!isCollectionOf(m, this.require('plug/models/Room'))) {
      return false;
    }
    // the dashboardRooms collection has its own comparator that we can check!
    var fakeRoomA = { get: function (key) { return key === 'population' ? 10 : 'a'; } },
        fakeRoomB = { get: function (key) { return key === 'population' ? 10 : 'b'; } },
        fakeRoomC = { get: function (key) { return key === 'population' ? 20 : 'c'; } };
    return functionContains(m.comparator, 'population') &&
      functionContains(m.comparator, 'name') &&
      m.comparator(fakeRoomA, fakeRoomB) === 1 &&
      m.comparator(fakeRoomC, fakeRoomB) === -1;
  }).needs('plug/models/Room'),
  'plug/collections/friendRequests': new SimpleFetcher(function () {
    var FriendRequestsView = this.require('plug/views/users/friends/FriendRequestsView');
    return FriendRequestsView.prototype.collection;
  }).needs('plug/views/users/friends/FriendRequestsView'),
  'plug/collections/friends': new SimpleMatcher(function (m) {
    return isCollectionOf(m, this.require('plug/models/User')) &&
      _.isFunction(m.onUsersAdd) &&
      _.isFunction(m.lookup) &&
      _.isFunction(m.onRemove) &&
      _.isFunction(m.onAdd) &&
      'MAX' in m.constructor;
  }).needs('plug/models/User'),
  'plug/collections/friendsFiltered': new SimpleMatcher(function (m) {
    return isCollectionOf(m, this.require('plug/models/User')) &&
      _.isFunction(m.setFilter) &&
      m.comparator === 'uIndex' &&
      // usersFiltered has a sourceCollection
      !('sourceCollection' in m);
  }).needs('plug/models/User'),
  'plug/collections/history': new SimpleFetcher(function () {
    var RoomHistoryHandler = this.require('plug/handlers/RoomHistoryHandler');
    return RoomHistoryHandler.prototype.collection;
  }).needs('plug/handlers/RoomHistoryHandler'),
  'plug/collections/ignores': new StepwiseMatcher({
    // The IgnoreAction puts the received data in the `ignores` collection in the
    // `parse` method. So here we pretend to have a new ignore, add it to the collection,
    // and then find which collection was changed.
    setup: function () {
      var IgnoreAction = this.require('plug/actions/ignores/IgnoreAction');
      var User = this.require('plug/models/User')
      IgnoreAction.prototype.parse.call(
        // fake context with an empty trigger function to
        // 1) prevent an error, and
        // 2) not show the notification box that this would otherwise show.
        { trigger: function () {} },
        // fake "response"
        { code: 200, data: [ { id: -1000, username: '__test__' } ] }
      );
    },
    check: function (m) {
      return isCollectionOf(m, this.require('plug/models/User')) &&
        m.comparator === 'username' &&
        m.length > 0 && m.last().get('id') === -1000;
    },
    cleanup: function (ignores) {
      // get rid of the fake user
      ignores.pop();
    }
  }).needs('plug/models/User', 'plug/actions/ignores/IgnoreAction'),
  'plug/collections/mutes': new SimpleMatcher(function (m) {
    return isCollectionOf(m, this.require('plug/models/MutedUser'));
  }).needs('plug/models/MutedUser'),
  'plug/collections/myAvatars': new SimpleMatcher(function (m) {
    return isCollectionOf(m, this.require('plug/models/Avatar')) && _.isFunction(m.onChange);
  }).needs('plug/models/Avatar'),
  'plug/collections/myBadges': new SimpleMatcher(function (m) {
    return isCollectionOf(m, this.require('plug/models/Badge')) && _.isFunction(m.onChange);
  }).needs('plug/models/Badge'),
  'plug/collections/notifications': new SimpleMatcher(function (m) {
    return isCollectionOf(m, this.require('plug/models/Notification'));
  }).needs('plug/models/Notification'),
  'plug/collections/playlists': new SimpleMatcher(function (m) {
    return isCollectionOf(m, this.require('plug/models/Playlist')) &&
      _.isFunction(m.jumpToMedia) && _.isArray(m.activeMedia);
  }).needs('plug/models/Playlist'),
  'plug/collections/playlistSearchResults': new SimpleMatcher(function (m) {
    // playlist search doesn't actually exist right now, but the models
    // are there on the client side!
    return isCollectionOf(m, this.require('plug/models/MediaSearchResult'));
  }).needs('plug/models/MediaSearchResult'),
  'plug/collections/purchasableAvatars': new SimpleMatcher(function (m) {
    return isCollectionOf(m, this.require('plug/models/Avatar')) &&
      !_.isFunction(m.__generate) && // allAvatars
      !_.isFunction(m.onChange); // myAvatars
  }).needs('plug/models/Avatar'),
  'plug/collections/purchasableBadges': new SimpleMatcher(function (m) {
    return isCollectionOf(m, this.require('plug/models/Badge')) &&
      !_.isFunction(m.onChange); // myBadges
  }).needs('plug/models/Badge'),
  'plug/collections/relatedMedia': new SimpleMatcher(function (m) {
    // TODO
    return isCollectionOf(m, this.require('plug/models/Media')) && false;
  }).needs('plug/models/Media'),
  'plug/collections/restrictedMediaAlternatives': new SimpleMatcher(function (m) {
    // TODO
    return isCollectionOf(m, this.require('plug/models/Media')) && false;
  }).needs('plug/models/Media'),
  'plug/collections/soundCloudPlaylists': new SimpleMatcher(function (m) {
    return isCollectionOf(m, this.require('plug/models/SoundCloudPlaylist'));
  }).needs('plug/models/SoundCloudPlaylist'),
  // staff is only updated when a StaffListAction is triggered
  // eg. when the user navigates to the staff tab
  'plug/collections/staff': new SimpleMatcher(function (m) {
    return isCollectionOf(m, this.require('plug/models/User')) &&
      // differ from the general users collection
      !_.isFunction(m.getAudience) &&
      m.comparator === this.require('plug/util/comparators').role;
  }).needs('plug/models/User', 'plug/util/comparators'),
  'plug/collections/staffFiltered': new SimpleMatcher(function (m) {
    return isCollectionOf(m, this.require('plug/models/User')) && _.isFunction(m.setFilter) &&
      !('sourceCollection' in m);
  }).needs('plug/models/User'),
  'plug/collections/storeExtras': new SimpleMatcher(function (m) {
    return isCollectionOf(m, this.require('plug/models/StoreExtra'));
  }).needs('plug/models/StoreExtra'),
  'plug/collections/transactions': new SimpleMatcher(function (m) {
    return isCollectionOf(m, this.require('plug/models/Transaction'));
  }).needs('plug/models/Transaction'),
  'plug/collections/userHistory': new SimpleFetcher(function () {
    var UserHistoryHandler = this.require('plug/handlers/UserHistoryHandler');
    return UserHistoryHandler.prototype.collection;
  }).needs('plug/handlers/UserHistoryHandler'),
  'plug/collections/userRooms': new SimpleMatcher(function (m) {
    return isCollectionOf(m, this.require('plug/models/Room')) &&
      m !== this.require('plug/collections/dashboardRooms');
  }).needs('plug/models/Room', 'plug/collections/dashboardRooms'),
  'plug/collections/users': function (m) {
    return m instanceof Backbone.Collection && _.isFunction(m.getAudience);
  },
  'plug/collections/usersFiltered': new SimpleMatcher(function (m) {
    return isCollectionOf(m, this.require('plug/models/User')) && _.isFunction(m.setFilter) &&
      'sourceCollection' in m;
  }).needs('plug/models/User'),
  'plug/collections/waitlist': function (m) {
    return m instanceof Backbone.Collection && 'isTheUserPlaying' in m;
  },
  'plug/collections/youTubePlaylists': new SimpleMatcher(function (m) {
    return isCollectionOf(m, this.require('plug/models/YouTubePlaylist'));
  }).needs('plug/models/YouTubePlaylist'),
  'plug/collections/youTubePlaylist': new StepwiseMatcher({
    setup: function () {
      // the ImportYouTubeHandler updates the current youtube playlist items
      this.require('plug/handlers/ImportYouTubeHandler').prototype.onMediaLoaded.call(
        // fake context
        { finish: function () {} },
        // recognisable test data
        [ { id: -2000, author: 'plug-modules', title: 'Test item used to find the right collection.' } ]
      );
    },
    check: function (m) {
      return isCollectionOf(m, this.require('plug/models/Media')) &&
        m.length === 1 && m.last().get('id') === -2000;
    },
    cleanup: function (youtubePlaylist) {
      youtubePlaylist.reset();
    }
  }).needs('plug/models/Media', 'plug/handlers/ImportYouTubeHandler'),

  // facades
  'plug/facades/chatFacade': function (m) {
    return _.isFunction(m.onChatReceived) && _.isFunction(m.checkMutes);
  },
  'plug/facades/dashboardRoomsFacade': function (m) {
    return _.isFunction(m.more) && _.isFunction(m.loadFavorites);
  },
  'plug/facades/importSoundCloudFacade': function (m) {
    return _.isFunction(m.importAllAlert) && _.isFunction(m.importSelectedAlert);
  },
  'plug/facades/importYouTubeFacade': function (m) {
    return _.isFunction(m.importAlert) && _.isFunction(m.onImportMediaComplete);
  },
  'plug/facades/ImportMediaFacade': function (m) {
    return 'instance' in m && _.isFunction(m.instance.onCIDResult);
  },
  'plug/facades/relatedMediaFacade': function (m) {
    return _.isFunction(m.appendUnknown) && _.isFunction(m.resetRelated);
  },
  'plug/facades/remoteMediaFacade': function (m) {
    return _.isFunction(m.ytSearch) && _.isFunction(m.ytRelated) && _.isFunction(m.scPermalink);
  },
  'plug/facades/playlistsSearchFacade': function (m) {
    return _.isFunction(m.setQuery) && _.isFunction(m.onTimeout);
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
    return isView(m) && m.prototype.className === 'search' && _.isFunction(m.prototype.clear) &&
      m.prototype.template === this.require('hbs!templates/dashboard/Search');
  },
  'plug/views/dashboard/TutorialView': function (m) {
    return isView(m) && m.prototype.id === 'tutorial';
  },
  'plug/views/dashboard/list/CellView': function (m) {
    return isView(m) && _.isFunction(m.prototype.onFavorite) && _.isFunction(m.prototype.onFriends);
  },
  'plug/views/dashboard/list/GridView': new SimpleMatcher(function (m, name) {
    return isView(m) && m.prototype.className === 'grid' &&
      this.isInSameNamespace(name, 'plug/views/dashboard/list/CellView');
  }).needs('plug/views/dashboard/list/CellView'),
  'plug/views/dashboard/list/TabMenuView': function (m) {
    return isView(m) && m.prototype.className === 'tab-menu' && _.isFunction(m.prototype.select);
  },
  'plug/views/dashboard/header/DashboardHeaderView': function (m) {
    return isView(m) && m.prototype.className === 'app-header' &&
      viewHasElement(m, '.event-calendar');
  },
  'plug/views/dashboard/news/NewsView': function (m) {
    return isView(m) && m.prototype.id === 'news';
  },
  'plug/views/dashboard/news/NewsRowView': new SimpleMatcher(function (m, name) {
    return isView(m) && m.prototype.className === 'row' &&
      this.isInSameNamespace(name, 'plug/views/dashboard/news/NewsView');
  }).needs('plug/views/dashboard/news/NewsView'),

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
  'plug/views/footer/TwitterMenuView': function (m) {
    return isView(m) && m.prototype.id === 'twitter-menu';
  },
  'plug/views/footer/UserInfoView': function (m) {
    return isView(m) && m.prototype.className === 'info';
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
  'plug/views/dialogs/BadgeUnlockedDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-badge-unlocked';
  },
  'plug/views/dialogs/BoothLockDialog': function (m) {
    // BoothLockDialog pretends to be a confirm dialog! ):
    return isDialog(m) && m.prototype.id === 'dialog-confirm' &&
      functionContains(m.prototype.adjustTop, 'dialog.lockBoothCancel');
  },
  'plug/views/dialogs/ConfirmDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-confirm';
  },
  'plug/views/dialogs/ForceSkipDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-skip';
  },
  'plug/views/dialogs/GiftSendDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-gift-send';
  },
  'plug/views/dialogs/GiftReceiveDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-gift-receive';
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
  'plug/views/dialogs/PurchaseNameChangeView': function (m) {
    return isView(m) && m.prototype.className === 'username-box';
  },
  'plug/views/dialogs/PurchaseDialog': function (m) {
    return isDialog(m) && m.prototype.id === 'dialog-purchase';
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
  'plug/views/playlists/help/PlaylistHelpView': function (m) {
    return isView(m) && m.prototype.className === 'media-list' &&
      _.isFunction(m.prototype.onResize)
      viewHasElement(m, '.playlist-overlay-help');
  },
  'plug/views/playlists/import/PlaylistImportPanelView': function (m) {
    return isView(m) && m.prototype.id === 'playlist-import-panel';
  },
  'plug/views/playlists/media/headers/ImportHeaderView': function (m) {
    return isView(m) && m.prototype.className === 'header import' &&
      m.prototype.template === this.require('hbs!templates/playlist/media/headers/ImportHeader')();
  },
  'plug/views/playlists/media/MediaPanelView': function (m) {
    // TODO ensure that there are no other modules that match this footprint
    return isView(m) && m.prototype.id === 'media-panel';
  },
  'plug/views/playlists/media/panels/RoomHistoryPanelView': new SimpleMatcher(function (m) {
    return isView(m) && m.prototype.listClass === 'history' &&
      m.prototype.collection === this.require('plug/collections/history');
  }).needs('plug/collections/history'),
  'plug/views/playlists/media/panels/RoomHistoryRowView': new SimpleFetcher(function () {
    var RoomHistoryPanelView = this.require('plug/views/playlists/media/panels/RoomHistoryPanelView');
    return RoomHistoryPanelView.prototype.RowClass;
  }).needs('plug/views/playlists/media/panels/RoomHistoryPanelView'),
  'plug/views/playlists/media/panels/UserHistoryPanelView': new SimpleMatcher(function (m) {
    return isView(m) && m.prototype.collection === this.require('plug/collections/userHistory');
  }).needs('plug/collections/userHistory'),
  'plug/views/playlists/media/panels/UserHistoryRowView': new SimpleFetcher(function () {
    var UserHistoryPanelView = this.require('plug/views/playlists/media/panels/UserHistoryPanelView');
    return UserHistoryPanelView.prototype.RowClass;
  }).needs('plug/views/playlists/media/panels/UserHistoryPanelView'),
  'plug/views/playlists/media/panels/PlaylistPanelView': new SimpleMatcher(function (m) {
     return isView(m) && m.prototype.collection === this.require('plug/collections/currentPlaylistFiltered');
   }).needs('plug/collections/currentPlaylistFiltered'),
  'plug/views/playlists/media/panels/PlaylistRowView': new SimpleFetcher(function () {
    var PlaylistPanel = this.require('plug/views/playlists/media/panels/PlaylistPanelView');
    return PlaylistPanel.prototype.RowClass;
  }).needs('plug/views/playlists/media/panels/PlaylistPanelView'),
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
  'plug/views/users/userRolloverView': function (m) {
    return m instanceof Backbone.View && m.id === 'user-rollover';
  },
  'plug/views/users/UserView': function (m) {
    return isView(m) && m.prototype.id === 'user-view';
  },
  'plug/views/users/TabbedPanelView': function (m) {
    return isView(m) && 'defaultTab' in m.prototype && m.prototype.defaultTab === undefined;
  },

  'plug/views/users/communities/CommunitiesView': function (m) {
    return isView(m) && m.prototype.id === 'user-communities';
  },
  'plug/views/users/communities/CommunityGridView': new SimpleMatcher(function (m, name) {
    return isView(m) && m.prototype.className === 'grid' &&
      this.isInSameNamespace(name, 'plug/views/users/communities/CommunitiesView');
  }).needs('plug/views/users/communities/CommunitiesView'),
  'plug/views/users/friends/FriendsView': function (m) {
    return isView(m) && m.prototype.id === 'user-friends';
  },
  'plug/views/users/friends/FriendsTabMenuView': new SimpleMatcher(function (m, name) {
    return isView(m) && m.prototype.className === 'tab-menu' &&
      this.isInSameNamespace(name, 'plug/views/users/friends/FriendsView');
  }).needs('plug/views/users/friends/FriendsView'),
  'plug/views/users/friends/FriendRowView': function (m) {
    return isView(m) && m.prototype.className === 'row' &&
      m.prototype.buttonTemplate === this.require('hbs!templates/user/friends/UserFriendButtons');
  },
  'plug/views/users/friends/FriendsListView': new SimpleMatcher(function (m) {
    return isView(m) && m.prototype.className === 'all section' &&
      m.prototype.RowClass === this.require('plug/views/users/friends/FriendRowView');
  }).needs('plug/views/users/friends/FriendRowView'),
  'plug/views/users/friends/FriendRequestRowView': function (m) {
    return isView(m) && m.prototype.className === 'row' &&
      m.prototype.buttonTemplate === this.require('hbs!templates/user/friends/UserRequestButtons');
  },
  'plug/views/users/friends/FriendRequestsView': new SimpleMatcher(function (m) {
    return isView(m) && m.prototype.className === 'requests section' &&
      m.prototype.RowClass === this.require('plug/views/users/friends/FriendRequestRowView');
  }).needs('plug/views/users/friends/FriendRequestRowView'),
  'plug/views/users/friends/ListView': new SimpleMatcher(function (m, name) {
    return isView(m) && 'collection' in m.prototype && 'RowClass' in m.prototype &&
      m.prototype.collection === undefined && m.prototype.RowClass === undefined &&
      this.isInSameNamespace(name, 'plug/views/users/friends/FriendsView');
  }).needs('plug/views/users/friends/FriendsView'),
  'plug/views/users/friends/SearchView': function (m) {
    return isView(m) && m.prototype.template === this.require('hbs!templates/user/friends/Search');
  },
  'plug/views/users/inventory/InventoryView': function (m) {
    return isView(m) && m.prototype.id === 'user-inventory';
  },
  'plug/views/users/inventory/InventoryTabMenuView': function (m) {
    return isView(m) && m.prototype.template === this.require('hbs!templates/user/inventory/TabMenu');
  },
  'plug/views/users/inventory/InventoryCategoryView': function (m) {
    return isView(m) && 'collection' in m.prototype && 'eventName' in m.prototype &&
      m.prototype.collection === undefined && m.prototype.eventName === undefined;
  },
  'plug/views/users/inventory/AvatarsView': new SimpleMatcher(function (m) {
    return isView(m) && m.prototype.className === 'avatars' &&
      m.prototype.eventName === this.require('plug/events/StoreEvent').GET_USER_AVATARS;
  }).needs('plug/events/StoreEvent'),
  'plug/views/users/inventory/AvatarsDropdownView': function (m) {
    return isView(m) && m.prototype.className === 'dropdown' &&
      functionContains(m.prototype.draw, '.userAvatars.base');
  },
  'plug/views/users/inventory/AvatarCellView': new SimpleMatcher(function (m, name) {
    return isView(m) && m.prototype.className === 'cell' &&
      _.isFunction(m.prototype.getBlinkFrame) &&
     this.isInSameNamespace(name, 'plug/views/users/inventory/InventoryView');
  }).needs('plug/views/users/inventory/InventoryView'),
  'plug/views/users/inventory/BadgesView': new SimpleMatcher(function (m) {
    return isView(m) && m.prototype.className === 'badges' &&
      m.prototype.eventName === this.require('plug/events/StoreEvent').GET_USER_BADGES;
  }).needs('plug/events/StoreEvent'),
  'plug/views/users/inventory/BadgeCellView': function (m, name) {
    return isView(m) && m.prototype.className === 'cell' &&
      functionContains(m.prototype.render, 'change:badge');
  },
  'plug/views/users/inventory/TransactionHistoryView': new SimpleMatcher(function (m, name) {
    return isView(m) && m.prototype.className === 'history' &&
     functionContains(m.prototype.render, 'GET_USER_TRANSACTIONS') &&
     this.isInSameNamespace(name, 'plug/views/users/inventory/InventoryView');
  }).needs('plug/views/users/inventory/InventoryView'),
  'plug/views/users/inventory/TransactionRowView': function (m) {
    return isView(m) && m.prototype.className === 'row' &&
      functionContains(m.prototype.render, 'boost3x');
  },
  'plug/views/users/profile/ExperienceView': function (m) {
    return isView(m) && m.prototype.className === 'experience section';
  },
  'plug/views/users/profile/MetaView': function (m) {
    return isView(m) && m.prototype.className === 'meta section';
  },
  'plug/views/users/profile/NotificationsView': function (m) {
    return isView(m) && m.prototype.className === 'notifications section';
  },
  'plug/views/users/profile/NotificationView': function (m) {
    return isView(m) && m.prototype.className === 'row' &&
      // Lang.userNotifications
      functionContains(m.prototype.render, 'userNotifications');
  },
  'plug/views/users/profile/PointsView': function (m) {
    return isView(m) && m.prototype.className === 'points';
  },
  // Current User Profile,
  'plug/views/users/profile/ProfileView': function (m) {
    return isView(m) && m.prototype.id === 'the-user-profile';
  },
  // Other user profiles? (On the profile pages?)
  'plug/views/users/profile/UnusedProfileView': function (m) {
    return isView(m) && m.prototype.id === 'user-profile';
  },

  'plug/views/users/menu/UserMenuView': function (m) {
    return isView(m) && m.prototype.id === 'user-menu';
  },
  'plug/views/users/menu/TabMenuView': function (m) {
    return isView(m) && m.prototype.className === 'tab-menu' &&
      'template' in m.prototype && m.prototype.template === undefined;
  },

  'plug/views/users/history/UserHistoryView': function (m) {
    return isView(m) && m.prototype.id === 'user-history';
  },

  'plug/views/users/settings/SettingsView': function (m) {
    return isView(m) && m.prototype.id === 'user-settings';
  },
  // there's a bunch of different TabMenuViews, this one is only different from the rest in the methods it lacks
  'plug/views/users/settings/TabMenuView': function (m) {
    return isView(m) && m.prototype.className === 'tab-menu' &&
      !('selectStore' in m.prototype) && !('selectRequests' in m.prototype) &&
      functionContains(m.prototype.onClick, 'application');
  },
  'plug/views/users/settings/SettingsApplicationView': function (m) {
    return isView(m) && m.prototype.className === 'application section';
  },
  'plug/views/users/settings/LanguageDropdownView': function (m) {
    return isView(m) && functionContains(m.prototype.render, '.languages') &&
      functionContains(m.prototype.render, '.get("language")');
  },
  'plug/views/users/settings/SettingsAccountView': function (m) {
    return isView(m) && m.prototype.className === 'account section';
  },
  'plug/views/users/store/StoreView': function (m) {
    return isView(m) && m.prototype.id === 'user-store';
  },
  'plug/views/users/store/CategoryView': todo,
  'plug/views/users/store/AvatarsView': todo,
  'plug/views/users/store/AvatarsDropdownView': todo,
  'plug/views/users/store/AvatarCellView': todo,
  'plug/views/users/store/BundleCellView': todo,
  'plug/views/users/store/BadgesView': todo,
  'plug/views/users/store/BadgeCellView': todo,
  'plug/views/users/store/MiscView': todo,
  'plug/views/users/store/MiscCellView': todo,
  'plug/views/users/store/TabMenuView': todo,

  'plug/views/rooms/audienceView': function (m) {
    return m instanceof Backbone.View && m.id === 'audience';
  },
  'plug/views/rooms/roomLoaderView': function (m) {
    return m instanceof Backbone.View && m.className === 'loading-box';
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
  'plug/views/rooms/header/HistoryPanelView': function (m) {
    return isView(m) && m.prototype.id === 'history-panel';
  },
  'plug/views/rooms/header/NowPlayingView': function (m) {
    return isView(m) && m.prototype.id === 'now-playing-bar';
  },
  'plug/views/rooms/header/RoomMetaView': function (m) {
    return isView(m) && m.prototype.id === 'room-meta';
  },
  'plug/views/rooms/header/RoomBarView': function (m) {
    return isView(m) && m.prototype.id === 'room-bar';
  },
  'plug/views/rooms/header/HeaderPanelBarView': function (m) {
    return isView(m) && m.prototype.id === 'header-panel-bar';
  },
  'plug/views/rooms/header/RoomHeaderView': new SimpleMatcher(function (m, name) {
    return isView(m) && m.prototype.className === 'app-header' &&
      this.isInSameNamespace(name, 'plug/views/rooms/header/HeaderPanelBarView');
  }).needs('plug/views/rooms/header/HeaderPanelBarView'),
  'plug/views/rooms/playback/PlaybackView': function (m) {
    return isView(m) && m.prototype.id === 'playback';
  },
  'plug/views/rooms/playback/VolumeView': function (m) {
    return isView(m) && m.prototype.id === 'volume';
  },
  'plug/views/rooms/users/BansListView': function (m) {
    return isView(m) && m.prototype.className === 'list bans';
  },
  'plug/views/rooms/users/BanRowView': new SimpleFetcher(function () {
    var BansListView = this.require('plug/views/rooms/users/BansListView');
    return BansListView.prototype.RowClass;
  }).needs('plug/views/rooms/users/BansListView'),
  'plug/views/rooms/users/FriendsListView': function (m) {
    return isView(m) && m.prototype.className === 'friends';
  },
  'plug/views/rooms/users/FriendRowView': new SimpleMatcher(function (m, name) {
   return isView(m) && m.prototype.className === 'row' &&
     _.isFunction(m.prototype.onAvatarChange) &&
     _.isFunction(m.prototype.onStatusChange) &&
     this.isInSameNamespace(name, 'plug/views/rooms/users/FriendsListView');
  }).needs('plug/views/rooms/users/FriendsListView'),
  'plug/views/rooms/users/IgnoresListView': function (m) {
    return isView(m) && m.prototype.className === 'list ignored';
  },
  'plug/views/rooms/users/IgnoreRowView': new SimpleFetcher(function () {
    var IgnoresListView = this.require('plug/views/rooms/users/IgnoresListView');
    return IgnoresListView.prototype.RowClass;
  }).needs('plug/views/rooms/users/IgnoresListView'),
  'plug/views/rooms/users/MutesListView': function (m) {
    return isView(m) && m.prototype.className === 'list mutes';
  },
  'plug/views/rooms/users/MuteRowView': new SimpleFetcher(function () {
    var MutesListView = this.require('plug/views/rooms/users/MutesListView');
    return MutesListView.prototype.RowClass;
  }).needs('plug/views/rooms/users/MutesListView'),
  'plug/views/rooms/users/RoomUsersListView': function (m) {
    return isView(m) && m.prototype.className === 'list room';
  },
  'plug/views/rooms/users/RoomUserRowView': new SimpleFetcher(function () {
    var RoomUsersListView = this.require('plug/views/rooms/users/RoomUsersListView');
    return RoomUsersListView.prototype.RowClass;
  }).needs('plug/views/rooms/users/RoomUsersListView'),
  'plug/views/rooms/users/StaffListView': function (m) {
    return isView(m) && m.prototype.className === 'list staff';
  },
  'plug/views/rooms/users/StaffGroupView': function (m) {
    return isView(m) && m.prototype.className === 'group';
  },
  'plug/views/rooms/users/StaffRowView': function (m) {
    return isView(m) && m.prototype.className === 'user' &&
      !('onConfirm' in m.prototype); // not WaitListRowView, BanRowView, MuteRowView & IgnoreRowView
  },
  'plug/views/rooms/users/UserListView': new SimpleMatcher(function (m) {
    return isView(m) && m.prototype.className === 'list' &&
      m.prototype.collection === this.require('plug/collections/usersFiltered');
  }).needs('plug/collections/usersFiltered'),
  'plug/views/rooms/users/userListsPanelView': function (m) {
    return m instanceof Backbone.View && m.id === 'user-lists';
  },
  'plug/views/rooms/users/WaitListView': function (m) {
    return isView(m) && m.prototype.id === 'waitlist';
  },
  'plug/views/rooms/users/WaitListRowView': function (m) {
    return isView(m) && m.prototype.className === 'user' &&
      _.isFunction(m.prototype.onRemoveClick);
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
    return m instanceof Backbone.View && functionContains(m.show, 'plugdjpopout');
  },
  'plug/views/rooms/popout/PopoutVoteView': function (m) {
    // subclass of VotePanelView
    return isView(m) && m.__super__ && m.__super__.id === 'vote';
  },
  'plug/views/rooms/settings/GeneralSettingsView': function (m) {
    return isView(m) && m.prototype.className === 'general-settings';
  },
  'plug/views/rooms/settings/RoomSettingsMenuView': function (m) {
    return isView(m) && m.prototype.id === 'room-settings-menu';
  },
  'plug/views/rooms/settings/RoomSettingsView': function (m) {
    return isView(m) && m.prototype.id === 'room-settings';
  },
  'plug/views/rooms/settings/ChatLevelDropdownView': function (m) {
    return isView(m) && m.prototype.className === 'dropdown' &&
      functionContains(m.prototype.render, 'minChatLevel');
  },

  'plug/views/search/SearchView': function (m) {
    return isView(m) && m.prototype.className === 'search' &&
      'template' in m.prototype && m.prototype.template === undefined;
  }

};

// build default context
var context = new Context();
Object.keys(plugModules).forEach(function (name) {
  var detective = plugModules[name];
  if (!(detective instanceof Detective)) {
    detective = new SimpleMatcher(detective);
  }
  context.add(name, detective);
});

context.Context = Context;
// expose detective classes
context.Detective = Detective;
context.Matcher = Matcher;
context.SimpleMatcher = SimpleMatcher;
context.StepwiseMatcher = StepwiseMatcher;
context.EventMatcher = EventMatcher;
context.ActionMatcher = ActionMatcher;
context.AndMatcher = AndMatcher;
context.Fetcher = Fetcher;
context.SimpleFetcher = SimpleFetcher;
context.HandlerFetcher = HandlerFetcher;

context.modules = plugModules;

return context;

}));



define('extplug/boot',['plug-modules'],function () {

  var plugModules = require('plug-modules');

  plugModules.run();
  plugModules.register();

  var timer = null;
  require(['extplug/ExtPlug'], function _loaded(ExtPlug) {
    if (appViewExists()) {
      var cbs = window.extp || [];
      var ext = new ExtPlug();
      window.extp = ext;

      ext.enable();
      cbs.forEach(ext.push, ext);
      if (timer) {
        clearInterval(timer);
      }
    } else if (!timer) {
      timer = setInterval(function () {
        _loaded(ExtPlug);
      }, 20);
    }
  });

  function appViewExists() {
    try {
      var _ret = (function () {
        // the ApplicationView attaches an event handler on instantiation.
        var AppView = plugModules.require('plug/views/app/ApplicationView'),
            Events = plugModules.require('plug/core/Events');
        var evts = Events._events['show:room'];
        return {
          v: evts.some(function (event) {
            return event.ctx instanceof AppView;
          })
        };
      })();

      if (typeof _ret === 'object') return _ret.v;
    } catch (e) {
      return false;
    }
  }
});


define('extplug/models/Settings',['require','exports','module','backbone'],function (require, exports, module) {

  var Backbone = require('backbone');

  var Settings = Backbone.Model.extend({});

  module.exports = Settings;
});


define('extplug/store/settings',['require','exports','module','underscore','plug/store/settings','extplug/models/Settings'],function (require, exports, module) {

  var _ = require('underscore');
  var plugSettings = require('plug/store/settings');
  var Settings = require('extplug/models/Settings');

  var settings = new Settings();

  function sync() {
    var newSettings = _.extend({}, plugSettings.settings);
    var muted = $('#volume .icon').hasClass('icon-volume-off');
    // when you mute a song using the volume button, plug.dj does not change the associated setting.
    // here we fake a volume of 0% anyway if the volume is muted, so ExtPlug modules can just
    // use volume throughout and have it work.
    if (newSettings.volume !== 0 && muted) {
      newSettings.volume = 0;
    }
    newSettings.muted = muted;
    settings.set(newSettings);
  }

  settings.update = sync;

  module.exports = settings;
});


define('extplug/util/request',['require','exports','module','jquery'],function (require, exports, module) {

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


define('extplug/util/function',['require','exports','module','underscore'],function (require, exports, module) {

  var _ = require('underscore');

  /**
   * Replaces a Backbone class implementation by a different class implementation.
   * This is particularly useful for overriding plug.dj internal class behaviour. Extend
   * the class, and then replace the original implementation by your new implementation.
   *
   * This should not be used by modules for now, as it only supports one override at a time!
   *
   * @param {function()} oldClass The class to replace.
   * @param {function()} newClass Replacement.
   *
   * @return {function()} The patched class.
   */
  exports.replaceClass = function (oldClass, newClass, instances) {
    Object.defineProperty(oldClass, '$replaced', {
      writable: true,
      enumerable: false,
      configurable: false,
      value: { extend: oldClass.extend, proto: oldClass.prototype }
    });
    oldClass.extend = newClass.extend;
    oldClass.prototype = newClass.prototype;

    if (instances) {
      _.each(instances, function (instance) {
        instance.__proto__ = newClass.prototype;
      });
    }

    return oldClass;
  };

  /**
   * Restore a class to its original implementation.
   */
  exports.restoreClass = function (oldClass) {
    if (oldClass.$replaced) {
      oldClass.extend = oldClass.$replaced.extend;
      oldClass.prototype = oldClass.$replaced.prototype;
      delete oldClass.$replaced;
    }
    return oldClass;
  };

  /**
   * Concisely binds a method to an object.
   *
   * @param {Object} obj Base object.
   * @param {string} key Method name.
   */
  exports.bound = function (obj, key) {
    obj[key] = obj[key].bind(obj);
  };
});


define('extplug/models/RoomSettings',['require','exports','module','plug/models/currentRoom','extplug/util/request','extplug/util/function','backbone','plug/core/Events'],function (require, exports, module) {

  var currentRoom = require('plug/models/currentRoom'),
      request = require('extplug/util/request'),
      fnUtils = require('extplug/util/function'),
      Backbone = require('backbone'),
      Events = require('plug/core/Events');

  var RoomSettings = Backbone.Model.extend({

    constructor: function constructor(ext) {
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

    load: function load() {
      var description = currentRoom.get('description'),
          m = description.match(/(?:^|\n)@p3=(.*?)(?:\n|$)/);

      if (m) {
        if (this._loaded[m[1]]) {
          this.onLoad(this._loaded[m[1]]);
        } else {
          request.json(m[1]).then((function (response) {
            this._loaded[m[1]] = response;
            this.onLoad(response);
          }).bind(this)).fail(function (e) {
            var message = '';
            if (e.status === 0) {
              message += ' Your browser or an extension may be blocking its URL.';
            } else if (e.status >= 400) {
              message += ' Its URL is not accessible.';
            } else if (e.status) {
              message += ' Status code: ' + e.status;
            }
            Events.trigger('notify', 'icon-chat-system', 'Room Settings could not be loaded for this room.' + message);
          });
        }
      }
    },

    onLoad: function onLoad(settings) {
      this.clear();
      this.trigger('load', settings);
      this.set(settings);
    },

    unload: function unload() {
      this.clear();
      this.trigger('unload');
    },

    reload: function reload() {
      if (currentRoom.get('joined')) {
        this.unload();
        this.load();
      }
    },

    dispose: function dispose() {
      currentRoom.off('change:description', this.reload);
    }

  });

  module.exports = RoomSettings;
});


define('extplug/models/Module',['require','exports','module','backbone'],function (require, exports, module) {

  var Backbone = require('backbone');

  return Backbone.Model.extend({

    defaults: {
      enabled: false,
      name: '',
      module: null
    },

    enable: function enable() {
      if (!this.get('enabled')) {
        this.set('enabled', true);
        this.get('module').enable();
      }
    },

    disable: function disable() {
      if (this.get('enabled')) {
        this.set('enabled', false);
        this.get('module').disable();
      }
    }

  });
});


define('extplug/collections/ModulesCollection',['require','exports','module','backbone','extplug/models/Module'],function (require, exports, module) {

  var Backbone = require('backbone'),
      Module = require('extplug/models/Module');

  var ModulesCollection = Backbone.Collection.extend({
    model: Module,
    comparator: function comparator(a, b) {
      return a.get('name') > b.get('name') ? 1 : a.get('name') < b.get('name') ? -1 : 0;
    }
  });

  module.exports = ModulesCollection;
});


define('extplug/views/users/ExtUserView',['require','exports','module','plug/views/users/UserView'],function (require, exports, module) {

  var UserView = require('plug/views/users/UserView');

  return UserView.extend({
    className: 'extplug app-left',
    show: function show(category, sub, _arg2) {
      this._super(category, sub, _arg2);

      if (category === 'settings' && sub === 'ext-plug') {
        this.view.menu.selectExtPlug();
      }
    }
  });
});


define('extplug/views/BaseView',['require','exports','module','backbone'],function (require, exports, module) {

  var Backbone = require('backbone');

  return Backbone.View.extend({});
});


define('extplug/util/Style',['require','exports','module','underscore','jquery'],function (require, exports, module) {

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
      _.each(props, function (val, prop) {
        if (_.isObject(val)) {
          // nested rules
          this.set(sel + ' ' + prop, val);
        } else {
          if (!(sel in this._rules)) this._rules[sel] = {};
          this._rules[sel][prop] = val;
        }
      }, this);
    } else {
      _.each(sel, function (ruleset, selector) {
        this.set(selector, ruleset);
      }, this);
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


define('extplug/views/users/settings/ControlGroupView',['require','exports','module','jquery','extplug/views/BaseView','extplug/util/Style'],function (require, exports, module) {

  var $ = require('jquery'),
      BaseView = require('extplug/views/BaseView'),
      Style = require('extplug/util/Style');

  var ControlGroupView = BaseView.extend({
    className: 'extplug control-group',

    initialize: function initialize(o) {
      this.name = o.name;
      this.controls = [];
    },

    render: function render() {
      this.$el.append($('<div>').addClass('header').append($('<span>').text(this.name)));

      var $el = this.$el,
          switchAt = Math.ceil(this.controls.length / 2 - 1),
          current = $('<div />').addClass('left').appendTo($el);
      this.controls.forEach(function (item, i) {
        current.append(item.$el);
        item.render();
        if (i === switchAt) {
          current = $('<div />').addClass('right').appendTo($el);
        }
      });
      return this;
    },

    add: function add(control) {
      this.controls.push(control);
      return this;
    }
  });

  ControlGroupView._style = new Style({
    '.extplug.control-group:not(:first-child) .header': {
      margin: '35px 0 8px 0 !important'
    }
  });

  module.exports = ControlGroupView;
});


define('extplug/views/dialogs/InstallModuleDialog',['require','exports','module','jquery','plug/views/dialogs/Dialog','plug/core/Events','plug/events/AlertEvent','plug/views/spinner/SpinnerView','extplug/util/Style'],function (require, exports, module) {

  var $ = require('jquery');
  var Dialog = require('plug/views/dialogs/Dialog');
  var Events = require('plug/core/Events');
  var AlertEvent = require('plug/events/AlertEvent');
  var SpinnerView = require('plug/views/spinner/SpinnerView');
  var Style = require('extplug/util/Style');

  function dirname(str) {
    str = str.split('/');
    str.pop();
    return str.join('/');
  }
  function basename(str) {
    return str.split('/').pop();
  }

  var InstallModuleDialog = Dialog.extend({
    id: 'dialog-install-module',
    className: 'dialog',
    render: function render() {
      this.$input = $('<input />').attr({
        type: 'text',
        placeholder: 'https://'
      });
      this.$wrap = $('<div />').addClass('dialog-input-background').append(this.$input);
      this.$el.append(this.getHeader('Install Module')).append(this.getBody().append(this.getMessage('Enter the URL of the module you wish to install:')).append(this.$wrap)).append(this.getButtons('Install', true));
      _.defer(this.deferFocus.bind(this));
      return this._super();
    },
    deferFocus: function deferFocus() {
      this.$input.focus();
    },
    submit: function submit() {
      var _this = this;

      var inp = this.$input;
      if (inp.val().length > 0 && inp.val().length > 0) {
        var spinner = new SpinnerView({ size: SpinnerView.LARGE });
        this.$el.find('.dialog-body').empty().append(spinner.$el);
        spinner.render();
        var url = inp.val();
        extp.install(url, function (err) {
          _this.close();
          if (err) {
            Events.dispatch(new AlertEvent(AlertEvent.ALERT, 'Install Module Error', 'Error: ' + err.message, function () {}));
          } else {
            Events.dispatch(new AlertEvent(AlertEvent.ALERT, 'Install Module', 'Module installed successfully.', function () {}));
          }
        });
      }
    },
    close: function close() {
      this.$input.off();
      this._super();
    }
  });

  InstallModuleDialog._style = new Style({
    '#dialog-install-module': {
      '.dialog-body': { height: '137px' },
      '.message': { top: '21px' },
      '.spinner': { top: '50%', left: '50%' },
      '.dialog-input-background': {
        top: '67px',
        width: '460px',
        height: '43px',
        left: '25px',
        input: {
          width: '440px'
        }
      }
    }
  });

  module.exports = InstallModuleDialog;
});


define('extplug/views/users/settings/GroupFooterView',['require','exports','module','backbone','extplug/util/Style'],function (require, exports, module) {
  var _require = require('backbone');

  var View = _require.View;

  var Style = require('extplug/util/Style');

  var GroupFooterView = View.extend({
    className: 'extplug-group-footer',

    render: function render() {
      this.$left = $('<div />').addClass('left');
      this.$right = $('<div />').addClass('right');
      this.$el.append(this.$left, this.$right);

      return this._super();
    }
  });

  GroupFooterView._style = new Style({
    // disgusting specificity hack
    '#user-view #user-settings .extplug-group-footer': {
      clear: 'both',
      button: {
        top: 'auto',
        position: 'relative'
      }
    }
  });

  module.exports = GroupFooterView;
});


define('extplug/views/users/settings/ModulesGroupView',['require','exports','module','plug/core/Events','plug/events/ShowDialogEvent','extplug/util/Style','extplug/views/dialogs/InstallModuleDialog','./GroupFooterView','./ControlGroupView'],function (require, exports, module) {

  var Events = require('plug/core/Events');
  var ShowDialogEvent = require('plug/events/ShowDialogEvent');
  var Style = require('extplug/util/Style');
  var InstallModuleDialog = require('extplug/views/dialogs/InstallModuleDialog');
  var FooterView = require('./GroupFooterView');
  var ControlGroupView = require('./ControlGroupView');

  var ModulesFooterView = FooterView.extend({
    render: function render() {
      this._super();
      this.$install = $('<button />').text('Install Module');
      this.$manage = $('<button />').text('Manage');

      this.$install.on('click', function () {
        Events.dispatch(new ShowDialogEvent(ShowDialogEvent.SHOW, new InstallModuleDialog()));
      });
      this.$manage.on('click', function () {
        Events.trigger('extplug:modules:manage');
      });

      this.$left.append(this.$install);
      this.$right.append(this.$manage);
      return this;
    },

    remove: function remove() {
      this.$install.off();
      this.$manage.off();
    }
  });

  var ModulesListView = ControlGroupView.extend({
    render: function render() {
      this._super();
      this.footer = new ModulesFooterView();
      this.footer.render();
      this.$el.append(this.footer.$el);
      return this;
    }
  });

  module.exports = ModulesListView;
});


define('extplug/views/users/settings/ManagingGroupView',['require','exports','module','plug/core/Events','./GroupFooterView','./ControlGroupView'],function (require, exports, module) {

  var Events = require('plug/core/Events');
  var FooterView = require('./GroupFooterView');
  var ControlGroupView = require('./ControlGroupView');

  var ManagingFooterView = FooterView.extend({
    render: function render() {
      this._super();
      this.$done = $('<button />').text('Done');
      this.$done.on('click', function () {
        Events.trigger('extplug:modules:unmanage');
      });
      this.$right.append(this.$done);
      return this;
    },

    remove: function remove() {
      this.$done.off();
    }
  });

  var ManagingListView = ControlGroupView.extend({
    render: function render() {
      this._super();
      this.footer = new ManagingFooterView();
      this.footer.render();
      this.$el.append(this.footer.$el);
      return this;
    }
  });

  module.exports = ManagingListView;
});


define('extplug/views/users/settings/ErrorCheckboxView',['require','exports','module','backbone','jquery'],function (require, exports, module) {

  var Backbone = require('backbone'),
      $ = require('jquery');

  /**
   * A checkbox setting item.
   */
  var ErrorCheckboxView = Backbone.View.extend({
    className: 'item',
    initialize: function initialize(o) {
      this.name = o.name;
      this.label = o.label;
    },
    render: function render() {
      this.$el.append('<i class="icon icon-chat-system" />').append($('<span />').css({ color: '#c42e3b' }).text(this.label));

      if (this.enabled) {
        this.$el.addClass('selected');
      }

      return this;
    },
    getValue: function getValue() {
      return false;
    },
    setValue: function setValue(enabled) {}
  });

  module.exports = ErrorCheckboxView;
});

// nothing;


define('extplug/views/users/settings/CheckboxView',['require','exports','module','backbone','jquery','plug/core/Events'],function (require, exports, module) {

  var Backbone = require('backbone'),
      $ = require('jquery'),
      Events = require('plug/core/Events');

  /**
   * A checkbox setting item.
   */
  var CheckboxView = Backbone.View.extend({
    className: 'item',
    initialize: function initialize(o) {
      this.label = o.label;
      this.description = o.description;
      this.enabled = o.enabled || false;
      this.onChange = this.onChange.bind(this);
    },
    render: function render() {
      this.$el.append('<i class="icon icon-check-blue" />').append($('<span />').text(this.label));

      if (this.description) {
        this.$el.on('mouseenter', (function () {
          Events.trigger('tooltip:show', this.description, this.$el);
        }).bind(this)).on('mouseleave', function () {
          Events.trigger('tooltip:hide');
        });
      }

      if (this.enabled) {
        this.$el.addClass('selected');
      }

      this.$el.on('click', this.onChange);
      return this;
    },
    onChange: function onChange() {
      this.$el.toggleClass('selected');
      var enabled = this.enabled;
      this.enabled = this.$el.hasClass('selected');
      if (enabled !== this.enabled) {
        this.trigger('change', this.getValue());
      }
    },
    getValue: function getValue() {
      return this.enabled;
    },
    setValue: function setValue(enabled) {
      this.enabled = enabled;
      if (enabled) {
        this.$el.addClass('selected');
      } else {
        this.$el.removeClass('selected');
      }
    }
  });

  module.exports = CheckboxView;
});


define('extplug/views/users/settings/DropdownView',['require','exports','module','backbone','jquery','underscore','extplug/util/function'],function (require, exports, module) {

  var Backbone = require('backbone'),
      $ = require('jquery'),
      _ = require('underscore'),
      fnUtils = require('extplug/util/function');

  var DropdownView = Backbone.View.extend({
    className: 'dropdown',
    tagName: 'dl',
    initialize: function initialize() {
      if (!this.options.selected) {
        this.options.selected = Object.keys(this.options.options)[0];
      }

      fnUtils.bound(this, 'onDocumentClick');
      fnUtils.bound(this, 'onBaseClick');
      fnUtils.bound(this, 'onRowClick');
    },
    render: function render() {
      this.$selectedValue = $('<span />');
      this.$selected = $('<dt />').append(this.$selectedValue).append($('<i />').addClass('icon icon-arrow-down-grey')).append($('<i />').addClass('icon icon-arrow-up-grey'));

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

      this.$el.append(this.$selected).append(this.$rows);

      this.$selected.on('click', this.onBaseClick);
      this.$rows.on('click', this.onRowClick);
      // trigger the above as a default
      if (selected) {
        selected.click();
      }
      return this;
    },
    close: function close() {
      this.$el.removeClass('open');
      $(document).off('click', this.onDocumentClick);
    },
    remove: function remove() {
      this.$('dt, dd').off();
      $(document).off('click', this.onDocumentClick);
      this._super();
    },
    onBaseClick: function onBaseClick(e) {
      if (this.$el.hasClass('open')) {
        this.close();
      } else {
        this.$el.addClass('open');
        var self = this;
        _.defer(function () {
          $(document).on('click', self.onDocumentClick);
        });
      }
    },
    onRowClick: function onRowClick(e) {
      var row = $(e.target).closest('.row');
      this.$('.row').removeClass('selected');
      row.addClass('selected');
      this.$el.removeClass('open');
      this.$selectedValue.text(row.text());
      this.trigger('select', row.data('value'));
    },
    onDocumentClick: function onDocumentClick(e) {
      _.defer(this.close.bind(this));
    },
    getValue: function getValue() {
      return this.$rows.find('.selected').data('value');
    },
    setValue: function setValue() {}
  });

  module.exports = DropdownView;
});


define('extplug/views/users/settings/SliderView',['require','exports','module','backbone','jquery','extplug/util/Style'],function (require, exports, module) {
  var Backbone = require('backbone'),
      $ = require('jquery'),
      Style = require('extplug/util/Style');

  function template(o) {
    return '<span class="title">' + o.label + '</span>' + '<span class="value"></span>' + '<div class="counts">' + '<span class="count">' + o.min + '</span>' + '<span class="count">' + o.max + '</span>' + '<span class="stretch"></span>' + '</div>' + '<div class="slider">' + '<div class="bar"></div>' + '<div class="circle"></div>' + '<div class="hit"></div>' + '</div>';
  }

  var SliderView = Backbone.View.extend({
    className: 'extplug-slider cap',
    initialize: function initialize() {
      this.onStart = this.onStart.bind(this);
      this.onMove = this.onMove.bind(this);
      this.onStop = this.onStop.bind(this);
      this._value = this.options.value || this.options.min;
    },
    render: function render() {
      this.$el.append(template(this.options));
      this.$bar = this.$('.bar');
      this.$hit = this.$('.hit').on('mousedown', this.onStart);
      this.$circle = this.$('.circle');
      this.$value = this.$('.value');
      _.delay((function () {
        this.setValue(this._value, true);
      }).bind(this));
      return this;
    },
    onStart: function onStart() {
      $(document).on('mousemove', this.onMove).on('mouseup', this.onStop);
    },
    onMove: function onMove(e) {
      var offset = e.pageX - this.$hit.offset().left;
      var percent = Math.max(0, Math.min(1, offset / (this.$hit.width() - this.$circle.width())));
      var value = Math.round(this.options.min + percent * (this.options.max - this.options.min));
      this.setValue(Math.max(this.options.min, value));
      e.preventDefault();
      e.stopPropagation();
    },
    onStop: function onStop() {
      $(document).off('mousemove', this.onMove).off('mouseup', this.onStop);
    },
    getValue: function getValue() {
      return this._value;
    },
    setValue: function setValue(value, force) {
      if (value !== this._value || force) {
        var percent = (value - this.options.min) / (this.options.max - this.options.min);
        this.$circle.css('left', parseInt(this.$hit.css('left'), 10) + (this.$hit.width() - this.$circle.width()) * percent - this.$circle.width() / 2);
        this.$value.text(value);
        this.trigger('change', value);
        this._value = value;
      }
    }
  });

  SliderView._style = new Style({
    '.extplug-slider': {
      '.counts .count:nth-child(2)': {
        float: 'right'
      }
    }
  });

  module.exports = SliderView;
});


define('extplug/views/users/settings/RemoveBoxView',['require','exports','module','backbone','jquery','plug/core/Events','plug/views/dialogs/ConfirmDialog','plug/events/ShowDialogEvent'],function (require, exports, module) {
  var _require = require('backbone');

  var View = _require.View;

  var $ = require('jquery');
  var Events = require('plug/core/Events');
  var ConfirmDialog = require('plug/views/dialogs/ConfirmDialog');
  var ShowDialogEvent = require('plug/events/ShowDialogEvent');

  /**
   * A checkbox setting item.
   */
  var RemoveBoxView = View.extend({
    className: 'item selected',
    initialize: function initialize() {
      this.onRemove = this.onRemove.bind(this);
    },
    render: function render() {
      this.$icon = $('<i />').addClass('icon icon-delete');
      this.$el.append(this.$icon).append($('<span />').text(this.model.get('name')));

      this.$el.css('cursor', 'default');
      this.$icon.css('cursor', 'pointer').css({ top: '-6px', left: '-4px' });

      this.$icon.on('click', this.onRemove);
      return this;
    },
    onRemove: function onRemove() {
      var _this = this;

      Events.dispatch(new ShowDialogEvent(ShowDialogEvent.SHOW, new ConfirmDialog({
        title: 'Remove Module',
        message: 'Are you sure you want to uninstall this module?',
        action: function action() {
          extp.uninstall(_this.model.get('id'));
        }
      })));
    }
  });

  module.exports = RemoveBoxView;
});


define('extplug/views/users/settings/SettingsView',['require','exports','module','extplug/views/BaseView','extplug/views/users/settings/ControlGroupView','./ModulesGroupView','./ManagingGroupView','extplug/views/users/settings/ErrorCheckboxView','extplug/views/users/settings/CheckboxView','extplug/views/users/settings/DropdownView','extplug/views/users/settings/SliderView','./RemoveBoxView','extplug/models/Module','plug/core/Events','underscore','jquery'],function (require, exports, module) {
  var BaseView = require('extplug/views/BaseView'),
      ControlGroupView = require('extplug/views/users/settings/ControlGroupView'),
      ModulesGroupView = require('./ModulesGroupView'),
      ManagingGroupView = require('./ManagingGroupView'),
      ErrorCheckboxView = require('extplug/views/users/settings/ErrorCheckboxView'),
      CheckboxView = require('extplug/views/users/settings/CheckboxView'),
      DropdownView = require('extplug/views/users/settings/DropdownView'),
      SliderView = require('extplug/views/users/settings/SliderView'),
      RemoveBoxView = require('./RemoveBoxView'),
      ModuleMeta = require('extplug/models/Module'),
      Events = require('plug/core/Events'),
      _ = require('underscore'),
      $ = require('jquery');

  /**
   * Wires a control to a setting model, updating the model when the control changes.
   *
   * @param {Backbone.View} el Control view.
   * @param {Backbone.Model} settings Model to reflect the settings to.
   * @param {string} target Relevant property on the model.
   */
  function wireSettingToModel(view, settings, target) {
    view.on('change', function (value) {
      settings.set(target, value);
    });
  }

  var SettingsView = BaseView.extend({
    className: 'ext-plug section',

    initialize: function initialize(o) {
      var _this = this;

      this.modules = o.modules;
      this.modules.on('reset add remove', function () {
        _this.refresh();
        _this.render();
      });
      this.ext = o.ext;
      this.mode = 'normal';

      this.refresh();
      this.manage = this.manage.bind(this);
      this.unmanage = this.unmanage.bind(this);

      Events.on('extplug:modules:manage', this.manage);
      Events.on('extplug:modules:unmanage', this.unmanage);
    },

    refresh: function refresh() {
      this.groups = [];
      if (this.mode === 'manage') {
        this.addGroup(this.createModulesManageGroup(), 1000);
      } else {
        this.addGroup(this.createModulesGroup(), 1000);
      }
      this.addGroup(this.createExtPlugGroup(), 999);
      this.modules.forEach(function (mod) {
        // add module settings group for stuff that was already enabled
        if (mod.get('enabled')) {
          var moduleSettings = this.createSettingsGroup(mod);
          if (moduleSettings) {
            this.addGroup(moduleSettings);
          }
        }
      }, this);
    },

    manage: function manage() {
      this.mode = 'manage';
      this.refresh();
      this.render();
    },
    unmanage: function unmanage() {
      this.mode = 'normal';
      this.refresh();
      this.render();
    },

    render: function render() {
      this.$container = $('<div>').addClass('container');
      this.$el.empty().append(this.$container);

      this.sort();
      this.groups.forEach(function (group) {
        this.$container.append(group.items.render().$el);
      }, this);

      return this;
    },

    createModulesGroup: function createModulesGroup() {
      var _this2 = this;

      var modulesGroup = new ModulesGroupView({ name: 'Modules' });
      // generate module list
      this.modules.forEach(function (mod) {
        var module = mod.get('module'),
            name = mod.get('name');
        if (module instanceof Error) {
          // this module errored out during its initialization
          modulesGroup.add(new ErrorCheckboxView({ label: name }));
        } else {
          var box = new CheckboxView({
            label: name,
            description: module.description || false,
            enabled: mod.get('enabled')
          });
          modulesGroup.add(box);
          box.on('change', function (value) {
            // add / remove module settings group
            if (value) {
              mod.enable();
              var moduleSettings = _this2.createSettingsGroup(mod);
              if (moduleSettings) {
                _this2.addGroup(moduleSettings);
                _this2.$container.append(moduleSettings.render().$el);
              }
            } else {
              mod.disable();
              var moduleSettings = _this2.getGroup(name);
              if (moduleSettings) {
                _this2.removeGroup(name);
                moduleSettings.remove();
              }
            }
          });
        }
      });

      return modulesGroup;
    },
    createModulesManageGroup: function createModulesManageGroup() {
      var modulesGroup = new ManagingGroupView({ name: 'Manage Modules' });
      // generate module list
      this.modules.forEach(function (mod) {
        modulesGroup.add(new RemoveBoxView({ model: mod }));
      });

      return modulesGroup;
    },
    createExtPlugGroup: function createExtPlugGroup() {
      return this.createSettingsGroup(new ModuleMeta({
        module: this.ext,
        name: 'ExtPlug'
      }));
    },

    createSettingsGroup: function createSettingsGroup(mod) {
      var module = mod.get('module');
      if (!module._settings) {
        return;
      }
      var group = new ControlGroupView({ name: mod.get('name') });
      var meta = module._settings;
      var settings = module.settings;

      _.each(meta, function (setting, name) {
        var control;
        switch (setting.type) {
          case 'boolean':
            control = new CheckboxView({
              label: setting.label,
              enabled: settings.get(name)
            });
            break;
          case 'dropdown':
            control = new DropdownView({
              label: setting.label,
              options: setting.options,
              selected: settings.get(name)
            });
            break;
          case 'slider':
            control = new SliderView({
              label: setting.label,
              min: setting.min,
              max: setting.max,
              value: settings.get(name)
            });
            break;
          default:
            control = new ErrorCheckboxView({ label: 'Unknown type for "' + name + '"' });
            break;
        }
        wireSettingToModel(control, settings, name);
        group.add(control);
      });

      return group;
    },

    sort: function sort() {
      this.groups.sort(function (a, b) {
        var c = b.priority - a.priority;
        if (c === 0) {
          c = a.items.get('name') > b.items.get('name') ? 1 : a.items.get('name') < b.items.get('name') ? -1 : 0;
        }
        return c;
      });
    },

    onResize: function onResize() {},

    addGroup: function addGroup(items, priority) {
      this.groups.push({
        items: items,
        priority: typeof priority === 'number' ? priority : 0
      });
    },

    getGroup: function getGroup(name) {
      for (var i = 0, l = this.groups.length; i < l; i++) {
        if (this.groups[i].items.name === name) {
          return this.groups[i].items;
        }
      }
    },

    hasGroup: function hasGroup(name) {
      return this.groups.some(function (group) {
        return group.items.name === name;
      });
    },

    removeGroup: function removeGroup(name) {
      for (var i = 0, l = this.groups.length; i < l; i++) {
        if (this.groups[i].items.name === name) {
          return this.groups.splice(i, 1);
        }
      }
    }

  });

  module.exports = SettingsView;
});


define('extplug/views/users/settings/TabMenuView',['require','exports','module','plug/views/users/settings/TabMenuView','jquery'],function (require, exports, module) {

  var SettingsTabMenuView = require('plug/views/users/settings/TabMenuView'),
      $ = require('jquery');

  return SettingsTabMenuView.extend({

    render: function render() {
      this._super();
      var extPlugTab = $('<button />').addClass('ext-plug').text('ExtPlug');
      this.$el.append(extPlugTab);
      extPlugTab.on('click', this.onClickExt.bind(this));

      var buttons = this.$('button');
      buttons.css('width', 100 / buttons.length + '%');
      return this;
    },

    onClickExt: function onClickExt(e) {
      var button = $(e.target);
      if (button.hasClass('ext-plug') && !button.hasClass('selected')) {
        this.selectExtPlug();
      }
    },

    selectExtPlug: function selectExtPlug() {
      this.$('button').removeClass('selected');
      this.$('button.ext-plug').addClass('selected');
      this.trigger('select', 'ext-plug');
    }

  });
});


define('extplug/Module',['require','exports','module','jquery','underscore','backbone','plug/core/Class','extplug/models/Settings','extplug/util/Style','extplug/util/function'],function (require, exports, module) {

  var jQuery = require('jquery'),
      _ = require('underscore'),
      Backbone = require('backbone'),
      Class = require('plug/core/Class'),
      Settings = require('extplug/models/Settings'),
      Style = require('extplug/util/Style'),
      fnUtils = require('extplug/util/function');

  var Module = Class.extend({
    init: function init(id, ext) {
      _.extend(this, Backbone.Events);

      this.id = id;
      this.ext = ext;
      this._styles = [];

      var settings = new Settings({});
      if (this.settings) {
        _.each(this.settings, function (setting, name) {
          settings.set(name, setting['default']);
        });
        this._settings = this.settings;
      }
      this.settings = settings;

      fnUtils.bound(this, 'refresh');
      fnUtils.bound(this, 'enable');
      fnUtils.bound(this, 'disable');
      fnUtils.bound(this, '$');
    },

    $: function $(sel) {
      return sel ? jQuery(sel, this.ext.document) : this.ext.document;
    },

    disable: function disable() {
      this.removeStyles();
    },
    enable: function enable() {},

    refresh: function refresh() {
      this.disable();
      this.enable();
    },

    Style: (function (_Style) {
      function Style(_x) {
        return _Style.apply(this, arguments);
      }

      Style.toString = function () {
        return _Style.toString();
      };

      return Style;
    })(function (o) {
      var style = new Style(o);
      this._styles.push(style);
      return style;
    }),

    removeStyles: function removeStyles() {
      while (this._styles.length > 0) {
        this._styles.pop().remove();
      }
    }
  });

  module.exports = Module;
});


define('extplug/facades/chatFacade',['require','exports','module','plug/facades/chatFacade','underscore','backbone'],function (require, exports, module) {
  var chatFacade = require('plug/facades/chatFacade');
  var _require = require('underscore');

  var clone = _require.clone;
  var Backbone = require('backbone');

  function onChatCommand(text) {
    var split = text.indexOf(' ');
    if (split === -1) {
      split = text.length;
    }
    var command = text.slice(1, split);
    var params = text.slice(split + 1);

    commands.trigger(command, params);
  }

  var commands = clone(Backbone.Events);

  var addedListener = false;
  chatFacade.registerCommand = function (command, callback) {
    if (!addedListener) {
      API.on(API.CHAT_COMMAND, onChatCommand);
    }
    commands.on(command, callback);
  };

  return chatFacade;
});


var _defineProperty = function (obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: key == null || typeof Symbol == 'undefined' || key.constructor !== Symbol, configurable: true, writable: true }); };

define('extplug/load-module',['require','exports','module','extplug/util/request'],function (require, exports, module) {

  var request = require('extplug/util/request');

  function parse(name) {
    var parts = name.split(';');
    var o = {};
    o.url = parts[0];
    if (parts[1]) {
      o.name = parts[1];
    }

    // force https
    o.url = o.url.replace(/^http:/, 'https:');

    return o;
  }

  exports.load = function (name, req, cb, config) {
    var o = parse(name);
    if (o.name) {
      // add module name alias to the module URL
      // this way, when we require([ module name ]), the module URL
      // will be loaded instead.
      // then, the module URL will define() the module name anyway,
      // and requirejs will figure everything out.
      // Chopping off the .js extension because require.js adds it
      // since we're actually requiring a module name and not a path.
      requirejs({ paths: _defineProperty({}, o.name, o.url.replace(/\.js$/, '')) });
    }
    requirejs([o.name || o.url], cb);
  };
});
define('extplug/package',{
  "name": "ExtPlug",
  "version": "0.7.0",
  "description": "Highly flexible, modular userscript extension for plug.dj.",
  "dependencies": {
    "plug-modules": "^4.0.0"
  },
  "devDependencies": {
    "gulp": "^3.8.11",
    "gulp-babel": "^5.1.0",
    "gulp-concat": "^2.5.2",
    "requirejs": "^2.1.17"
  },
  "scripts": {
    "build": "gulp build",
    "test": "jshint src"
  },
  "builtAt": 1430591382105
});
/** @license MIT License (c) copyright 2011-2013 original author or authors */

/**
 * meld
 * Aspect Oriented Programming for Javascript
 *
 * meld is part of the cujo.js family of libraries (http://cujojs.com/)
 *
 * Licensed under the MIT License at:
 * http://www.opensource.org/licenses/mit-license.php
 *
 * @author Brian Cavalier
 * @author John Hann
 * @version 1.3.1
 */
(function (define) {
define('meld',[],function () {

	//
	// Public API
	//

	// Add a single, specific type of advice
	// returns a function that will remove the newly-added advice
	meld.before =         adviceApi('before');
	meld.around =         adviceApi('around');
	meld.on =             adviceApi('on');
	meld.afterReturning = adviceApi('afterReturning');
	meld.afterThrowing =  adviceApi('afterThrowing');
	meld.after =          adviceApi('after');

	// Access to the current joinpoint in advices
	meld.joinpoint =      joinpoint;

	// DEPRECATED: meld.add(). Use meld() instead
	// Returns a function that will remove the newly-added aspect
	meld.add =            function() { return meld.apply(null, arguments); };

	/**
	 * Add an aspect to all matching methods of target, or to target itself if
	 * target is a function and no pointcut is provided.
	 * @param {object|function} target
	 * @param {string|array|RegExp|function} [pointcut]
	 * @param {object} aspect
	 * @param {function?} aspect.before
	 * @param {function?} aspect.on
	 * @param {function?} aspect.around
	 * @param {function?} aspect.afterReturning
	 * @param {function?} aspect.afterThrowing
	 * @param {function?} aspect.after
	 * @returns {{ remove: function }|function} if target is an object, returns a
	 *  remover { remove: function } whose remove method will remove the added
	 *  aspect. If target is a function, returns the newly advised function.
	 */
	function meld(target, pointcut, aspect) {
		var pointcutType, remove;

		if(arguments.length < 3) {
			return addAspectToFunction(target, pointcut);
		} else {
			if (isArray(pointcut)) {
				remove = addAspectToAll(target, pointcut, aspect);
			} else {
				pointcutType = typeof pointcut;

				if (pointcutType === 'string') {
					if (typeof target[pointcut] === 'function') {
						remove = addAspectToMethod(target, pointcut, aspect);
					}

				} else if (pointcutType === 'function') {
					remove = addAspectToAll(target, pointcut(target), aspect);

				} else {
					remove = addAspectToMatches(target, pointcut, aspect);
				}
			}

			return remove;
		}

	}

	function Advisor(target, func) {

		var orig, advisor, advised;

		this.target = target;
		this.func = func;
		this.aspects = {};

		orig = this.orig = target[func];
		advisor = this;

		advised = this.advised = function() {
			var context, joinpoint, args, callOrig, afterType;

			// If called as a constructor (i.e. using "new"), create a context
			// of the correct type, so that all advice types (including before!)
			// are called with the correct context.
			if(this instanceof advised) {
				// shamelessly derived from https://github.com/cujojs/wire/blob/c7c55fe50238ecb4afbb35f902058ab6b32beb8f/lib/component.js#L25
				context = objectCreate(orig.prototype);
				callOrig = function (args) {
					return applyConstructor(orig, context, args);
				};

			} else {
				context = this;
				callOrig = function(args) {
					return orig.apply(context, args);
				};

			}

			args = slice.call(arguments);
			afterType = 'afterReturning';

			// Save the previous joinpoint and set the current joinpoint
			joinpoint = pushJoinpoint({
				target: context,
				method: func,
				args: args
			});

			try {
				advisor._callSimpleAdvice('before', context, args);

				try {
					joinpoint.result = advisor._callAroundAdvice(context, func, args, callOrigAndOn);
				} catch(e) {
					joinpoint.result = joinpoint.exception = e;
					// Switch to afterThrowing
					afterType = 'afterThrowing';
				}

				args = [joinpoint.result];

				callAfter(afterType, args);
				callAfter('after', args);

				if(joinpoint.exception) {
					throw joinpoint.exception;
				}

				return joinpoint.result;

			} finally {
				// Restore the previous joinpoint, if necessary.
				popJoinpoint();
			}

			function callOrigAndOn(args) {
				var result = callOrig(args);
				advisor._callSimpleAdvice('on', context, args);

				return result;
			}

			function callAfter(afterType, args) {
				advisor._callSimpleAdvice(afterType, context, args);
			}
		};

		defineProperty(advised, '_advisor', { value: advisor, configurable: true });
	}

	Advisor.prototype = {

		/**
		 * Invoke all advice functions in the supplied context, with the supplied args
		 *
		 * @param adviceType
		 * @param context
		 * @param args
		 */
		_callSimpleAdvice: function(adviceType, context, args) {

			// before advice runs LIFO, from most-recently added to least-recently added.
			// All other advice is FIFO
			var iterator, advices;

			advices = this.aspects[adviceType];
			if(!advices) {
				return;
			}

			iterator = iterators[adviceType];

			iterator(this.aspects[adviceType], function(aspect) {
				var advice = aspect.advice;
				advice && advice.apply(context, args);
			});
		},

		/**
		 * Invoke all around advice and then the original method
		 *
		 * @param context
		 * @param method
		 * @param args
		 * @param applyOriginal
		 */
		_callAroundAdvice: function (context, method, args, applyOriginal) {
			var len, aspects;

			aspects = this.aspects.around;
			len = aspects ? aspects.length : 0;

			/**
			 * Call the next function in the around chain, which will either be another around
			 * advice, or the orig method.
			 * @param i {Number} index of the around advice
			 * @param args {Array} arguments with with to call the next around advice
			 */
			function callNext(i, args) {
				// If we exhausted all aspects, finally call the original
				// Otherwise, if we found another around, call it
				return i < 0
					? applyOriginal(args)
					: callAround(aspects[i].advice, i, args);
			}

			function callAround(around, i, args) {
				var proceedCalled, joinpoint;

				proceedCalled = 0;

				// Joinpoint is immutable
				// TODO: Use Object.freeze once v8 perf problem is fixed
				joinpoint = pushJoinpoint({
					target: context,
					method: method,
					args: args,
					proceed: proceedCall,
					proceedApply: proceedApply,
					proceedCount: proceedCount
				});

				try {
					// Call supplied around advice function
					return around.call(context, joinpoint);
				} finally {
					popJoinpoint();
				}

				/**
				 * The number of times proceed() has been called
				 * @return {Number}
				 */
				function proceedCount() {
					return proceedCalled;
				}

				/**
				 * Proceed to the original method/function or the next around
				 * advice using original arguments or new argument list if
				 * arguments.length > 0
				 * @return {*} result of original method/function or next around advice
				 */
				function proceedCall(/* newArg1, newArg2... */) {
					return proceed(arguments.length > 0 ? slice.call(arguments) : args);
				}

				/**
				 * Proceed to the original method/function or the next around
				 * advice using original arguments or new argument list if
				 * newArgs is supplied
				 * @param [newArgs] {Array} new arguments with which to proceed
				 * @return {*} result of original method/function or next around advice
				 */
				function proceedApply(newArgs) {
					return proceed(newArgs || args);
				}

				/**
				 * Create proceed function that calls the next around advice, or
				 * the original.  May be called multiple times, for example, in retry
				 * scenarios
				 * @param [args] {Array} optional arguments to use instead of the
				 * original arguments
				 */
				function proceed(args) {
					proceedCalled++;
					return callNext(i - 1, args);
				}

			}

			return callNext(len - 1, args);
		},

		/**
		 * Adds the supplied aspect to the advised target method
		 *
		 * @param aspect
		 */
		add: function(aspect) {

			var advisor, aspects;

			advisor = this;
			aspects = advisor.aspects;

			insertAspect(aspects, aspect);

			return {
				remove: function () {
					var remaining = removeAspect(aspects, aspect);

					// If there are no aspects left, restore the original method
					if (!remaining) {
						advisor.remove();
					}
				}
			};
		},

		/**
		 * Removes the Advisor and thus, all aspects from the advised target method, and
		 * restores the original target method, copying back all properties that may have
		 * been added or updated on the advised function.
		 */
		remove: function () {
			delete this.advised._advisor;
			this.target[this.func] = this.orig;
		}
	};

	/**
	 * Returns the advisor for the target object-function pair.  A new advisor
	 * will be created if one does not already exist.
	 * @param target {*} target containing a method with the supplied methodName
	 * @param methodName {String} name of method on target for which to get an advisor
	 * @return {Object|undefined} existing or newly created advisor for the supplied method
	 */
	Advisor.get = function(target, methodName) {
		if(!(methodName in target)) {
			return;
		}

		var advisor, advised;

		advised = target[methodName];

		if(typeof advised !== 'function') {
			throw new Error('Advice can only be applied to functions: ' + methodName);
		}

		advisor = advised._advisor;
		if(!advisor) {
			advisor = new Advisor(target, methodName);
			target[methodName] = advisor.advised;
		}

		return advisor;
	};

	/**
	 * Add an aspect to a pure function, returning an advised version of it.
	 * NOTE: *only the returned function* is advised.  The original (input) function
	 * is not modified in any way.
	 * @param func {Function} function to advise
	 * @param aspect {Object} aspect to add
	 * @return {Function} advised function
	 */
	function addAspectToFunction(func, aspect) {
		var name, placeholderTarget;

		name = func.name || '_';

		placeholderTarget = {};
		placeholderTarget[name] = func;

		addAspectToMethod(placeholderTarget, name, aspect);

		return placeholderTarget[name];

	}

	function addAspectToMethod(target, method, aspect) {
		var advisor = Advisor.get(target, method);

		return advisor && advisor.add(aspect);
	}

	function addAspectToAll(target, methodArray, aspect) {
		var removers, added, f, i;

		removers = [];
		i = 0;

		while((f = methodArray[i++])) {
			added = addAspectToMethod(target, f, aspect);
			added && removers.push(added);
		}

		return createRemover(removers);
	}

	function addAspectToMatches(target, pointcut, aspect) {
		var removers = [];
		// Assume the pointcut is a an object with a .test() method
		for (var p in target) {
			// TODO: Decide whether hasOwnProperty is correct here
			// Only apply to own properties that are functions, and match the pointcut regexp
			if (typeof target[p] == 'function' && pointcut.test(p)) {
				// if(object.hasOwnProperty(p) && typeof object[p] === 'function' && pointcut.test(p)) {
				removers.push(addAspectToMethod(target, p, aspect));
			}
		}

		return createRemover(removers);
	}

	function createRemover(removers) {
		return {
			remove: function() {
				for (var i = removers.length - 1; i >= 0; --i) {
					removers[i].remove();
				}
			}
		};
	}

	// Create an API function for the specified advice type
	function adviceApi(type) {
		return function(target, method, adviceFunc) {
			var aspect = {};

			if(arguments.length === 2) {
				aspect[type] = method;
				return meld(target, aspect);
			} else {
				aspect[type] = adviceFunc;
				return meld(target, method, aspect);
			}
		};
	}

	/**
	 * Insert the supplied aspect into aspectList
	 * @param aspectList {Object} list of aspects, categorized by advice type
	 * @param aspect {Object} aspect containing one or more supported advice types
	 */
	function insertAspect(aspectList, aspect) {
		var adviceType, advice, advices;

		for(adviceType in iterators) {
			advice = aspect[adviceType];

			if(advice) {
				advices = aspectList[adviceType];
				if(!advices) {
					aspectList[adviceType] = advices = [];
				}

				advices.push({
					aspect: aspect,
					advice: advice
				});
			}
		}
	}

	/**
	 * Remove the supplied aspect from aspectList
	 * @param aspectList {Object} list of aspects, categorized by advice type
	 * @param aspect {Object} aspect containing one or more supported advice types
	 * @return {Number} Number of *advices* left on the advised function.  If
	 *  this returns zero, then it is safe to remove the advisor completely.
	 */
	function removeAspect(aspectList, aspect) {
		var adviceType, advices, remaining;

		remaining = 0;

		for(adviceType in iterators) {
			advices = aspectList[adviceType];
			if(advices) {
				remaining += advices.length;

				for (var i = advices.length - 1; i >= 0; --i) {
					if (advices[i].aspect === aspect) {
						advices.splice(i, 1);
						--remaining;
						break;
					}
				}
			}
		}

		return remaining;
	}

	function applyConstructor(C, instance, args) {
		try {
			// Try to define a constructor, but don't care if it fails
			defineProperty(instance, 'constructor', {
				value: C,
				enumerable: false
			});
		} catch(e) {
			// ignore
		}

		C.apply(instance, args);

		return instance;
	}

	var currentJoinpoint, joinpointStack,
		ap, prepend, append, iterators, slice, isArray, defineProperty, objectCreate;

	// TOOD: Freeze joinpoints when v8 perf problems are resolved
//	freeze = Object.freeze || function (o) { return o; };

	joinpointStack = [];

	ap      = Array.prototype;
	prepend = ap.unshift;
	append  = ap.push;
	slice   = ap.slice;

	isArray = Array.isArray || function(it) {
		return Object.prototype.toString.call(it) == '[object Array]';
	};

	// Check for a *working* Object.defineProperty, fallback to
	// simple assignment.
	defineProperty = definePropertyWorks()
		? Object.defineProperty
		: function(obj, prop, descriptor) {
		obj[prop] = descriptor.value;
	};

	objectCreate = Object.create ||
		(function() {
			function F() {}
			return function(proto) {
				F.prototype = proto;
				var instance = new F();
				F.prototype = null;
				return instance;
			};
		}());

	iterators = {
		// Before uses reverse iteration
		before: forEachReverse,
		around: false
	};

	// All other advice types use forward iteration
	// Around is a special case that uses recursion rather than
	// iteration.  See Advisor._callAroundAdvice
	iterators.on
		= iterators.afterReturning
		= iterators.afterThrowing
		= iterators.after
		= forEach;

	function forEach(array, func) {
		for (var i = 0, len = array.length; i < len; i++) {
			func(array[i]);
		}
	}

	function forEachReverse(array, func) {
		for (var i = array.length - 1; i >= 0; --i) {
			func(array[i]);
		}
	}

	function joinpoint() {
		return currentJoinpoint;
	}

	function pushJoinpoint(newJoinpoint) {
		joinpointStack.push(currentJoinpoint);
		return currentJoinpoint = newJoinpoint;
	}

	function popJoinpoint() {
		return currentJoinpoint = joinpointStack.pop();
	}

	function definePropertyWorks() {
		try {
			return 'x' in Object.defineProperty({}, 'x', {});
		} catch (e) { /* return falsey */ }
	}

	return meld;

});
})(typeof define == 'function' && define.amd ? define : function (factory) { module.exports = factory(); }
);



var _toArray = function (arr) { return Array.isArray(arr) ? arr : Array.from(arr); };

var _toConsumableArray = function (arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } };

define('extplug/hooks/api-early',['require','exports','module','meld'],function (require, exports, module) {

  var meld = require('meld');

  function intercept(joinpoint) {
    var _joinpoint$args = _toArray(joinpoint.args);

    var eventName = _joinpoint$args[0];

    var params = _joinpoint$args.slice(1);

    API.trigger.apply(API,
    // userLeave → beforeUserLeave
    ['before' + eventName.charAt(0).toUpperCase() + eventName.slice(1)].concat(_toConsumableArray(params)));

    return joinpoint.proceed();
  }

  function nop() {
    return 'Dummy handler to ensure that plug.dj actually triggers the event';
  }

  // find default plug.dj API event names
  var eventKeys = Object.keys(API).filter(function (key) {
    return key.toUpperCase() === key && typeof API[key] === 'string';
  });

  var advice;
  exports.install = function () {
    advice = meld.around(API, 'dispatch', intercept);
    eventKeys.forEach(function (key) {
      // add the API constants for these, too
      API['BEFORE_' + key] = 'before' + API[key].charAt(0).toUpperCase() + API[key].slice(1);
      // plug.dj checks if an event is actually attached (through the _events hash)
      // before dispatching. We might run into situations where there is a BEFORE_
      // handler, but not a normal one, and we do need to get the BEFORE_ event to
      // trigger there. So we just pretend like we have handlers for all the things.
      API.on(API[key], nop);
    });
  };

  exports.uninstall = function () {
    eventKeys.forEach(function (key) {
      delete API['BEFORE_' + key];
      API.off(key, nop);
    });
    advice.remove();
  };
});


var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } };

define('extplug/hooks/chat',['require','exports','module','plug/facades/chatFacade','plug/core/Events','extplug/util/function','meld'],function (require, exports, module) {

  // Adds a bunch of new chat events.
  // "chat:incoming" is fired as soon as a new message is received from the socket.
  //   It gets three arguments: The Message object, a boolean `isSystemMessage`, and
  //   a boolean `isMine` (true if the current user sent the message.)
  // "chat:beforereceive" is fired after some initial processing, but before the message
  // is passed to the plug.dj view layer. This is where you probably want to do your
  // modifications to the Message object.
  // "chat:afterreceive" is fired after the message has been rendered. It gets two arguments:
  //   The Message object, and a jQuery object containing the message DOM element.
  // "chat:send" is fired when the user sends a message. It takes a single argument: A string
  //   with the text content of the message.

  var chatFacade = require('plug/facades/chatFacade'),
      Events = require('plug/core/Events'),
      fnUtils = require('extplug/util/function'),
      meld = require('meld');

  var onChatReceived = function onChatReceived(joinpoint) {
    var _joinpoint$args = _slicedToArray(joinpoint.args, 3);

    var message = _joinpoint$args[0];
    var isSystemMessage = _joinpoint$args[1];
    var isMine = _joinpoint$args[2];

    Events.trigger('chat:incoming', message, isSystemMessage, isMine);
    var result = joinpoint.proceed(message, isSystemMessage, isMine);
    var element = $('#chat-messages .cm:last-child');
    Events.trigger('chat:afterreceive', message, element);
    return result;
  };

  var fireBeforeReceive = function fireBeforeReceive(param1, param2) {
    Events.trigger('chat:beforereceive', param1, param2);
  };

  var onChatSend = function onChatSend(oldChatSend, param1) {
    Events.trigger('chat:send', param1);
    return oldChatSend(param1);
  };

  var ocradvice;
  exports.install = function () {
    Events.on('chat:receive', fireBeforeReceive);
    // ensure fireBeforeReceive is the first event handler to be called
    Events._events['chat:receive'].unshift(Events._events['chat:receive'].pop());
    ocradvice = meld.around(chatFacade, 'onChatReceived', onChatReceived);
  };

  exports.uninstall = function () {
    Events.off('chat:receive', fireBeforeReceive);
    ocradvice.remove();
  };
});


define('extplug/hooks/playback',['require','exports','module','plug/core/Events'],function (require, exports, module) {

  var Events = require('plug/core/Events');

  function onRefresh() {
    Events.trigger('playback:refresh');
  }
  function onHd() {
    Events.trigger('playback:hdVideo');
  }
  function onSnooze() {
    Events.trigger('playback:snooze');
  }

  exports.install = function () {
    $('#playback .refresh.button').on('click', onRefresh);
    $('#playback .hd.button').on('click', onHd);
    $('#playback .snooze.button').on('click', onSnooze);
  };

  exports.uninstall = function () {
    $('#playback .refresh.button').off('click', onRefresh);
    $('#playback .hd.button').off('click', onHd);
    $('#playback .snooze.button').off('click', onSnooze);
  };
});


define('extplug/ExtPlug',['require','exports','module','plug/models/currentMedia','plug/models/currentRoom','extplug/store/settings','plug/core/Events','plug/views/app/ApplicationView','plug/views/users/UserView','plug/views/users/settings/SettingsView','plug/views/rooms/chat/ChatView','plug/util/util','plug/util/emoji','extplug/models/RoomSettings','extplug/models/Module','extplug/collections/ModulesCollection','extplug/views/users/ExtUserView','extplug/views/users/settings/SettingsView','extplug/views/users/settings/TabMenuView','extplug/util/Style','extplug/util/function','extplug/Module','extplug/facades/chatFacade','extplug/load-module','extplug/package','jquery','underscore','backbone','meld','extplug/hooks/api-early','extplug/hooks/chat','extplug/hooks/playback'],function (require, exports, module) {

  var currentMedia = require('plug/models/currentMedia'),
      currentRoom = require('plug/models/currentRoom'),
      settings = require('extplug/store/settings'),
      Events = require('plug/core/Events'),
      ApplicationView = require('plug/views/app/ApplicationView'),
      UserView = require('plug/views/users/UserView'),
      UserSettingsView = require('plug/views/users/settings/SettingsView'),
      ChatView = require('plug/views/rooms/chat/ChatView'),
      plugUtil = require('plug/util/util'),
      emoji = require('plug/util/emoji'),
      RoomSettings = require('extplug/models/RoomSettings'),
      ModuleMeta = require('extplug/models/Module'),
      ModulesCollection = require('extplug/collections/ModulesCollection'),
      ExtUserView = require('extplug/views/users/ExtUserView'),
      ExtSettingsSectionView = require('extplug/views/users/settings/SettingsView'),
      ExtSettingsTabMenuView = require('extplug/views/users/settings/TabMenuView'),
      Style = require('extplug/util/Style'),
      fnUtils = require('extplug/util/function'),
      Module = require('extplug/Module'),
      chatFacade = require('extplug/facades/chatFacade'),
      loadModule = require('extplug/load-module'),
      _package = require('extplug/package'),
      $ = require('jquery'),
      _ = require('underscore'),
      Backbone = require('backbone'),
      meld = require('meld');

  var hooks = [require('extplug/hooks/api-early'), require('extplug/hooks/chat'), require('extplug/hooks/playback')];

  // LocalStorage key name for extplug
  var LS_NAME = 'extPlugModules';

  // Try to parse as JSON, defaulting to an empty object.
  function jsonParse(str) {
    try {
      return JSON.parse(str) || {};
    } catch (e) {}
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
    var evts = Events._events['show:room'];
    // Backbone event handlers have a .ctx property, containing what they will be bound to.
    // And ApplicationView adds a handler that's bound to itself!
    var appView;
    if (evts) {
      appView = _.find(evts, function (event) {
        return event.ctx instanceof ApplicationView;
      });
    }
    return appView && appView.ctx;
  }

  // Used for loading modules with relative dependencies
  // from remote URLs.
  // Require.js normally does some transformations to turn
  // a module name into a URL, but only if the module name does
  // not start with a protocol or end in a .js file extension.
  // Usually users will enter full URLs, and we want to be able
  // to resolve relative dependencies inside modules properly.
  // To make this happen, we replace https:// by extpremote/ in
  // user-entered URLs, and then suddenly require.js's usual rules
  // will apply.
  requirejs.config({
    paths: { extpremote: 'https://' }
  });

  /**
   * Main ExtPlug extension class.
   *
   * This will be instantiated by ExtPlug later, and can then be accessed
   * on `window.ext`.
   *
   * @constructor
   */
  var ExtPlug = Module.extend({
    name: 'ExtPlug',
    settings: {
      corsProxy: { type: 'boolean', 'default': true, label: 'Use CORS proxy' }
    },
    init: function init() {
      var _this = this;

      this._super('extplug', this);

      /**
       * Internal map of registered modules.
       * @type {Object.<string, Module>}
       */
      this._modules = new ModulesCollection();
      this._modules.on('change:enabled', function (mod, enabled) {
        _this._saveModuleSettings(mod.get('id'));
      });

      /**
       * jQuery Document object.
       * @type {jQuery|null}
       */
      this.document = null;

      // bound methods
      this.onClick = this.onClick.bind(this);
      this.onVolume = this.onVolume.bind(this);
      this.onJoinedChange = this.onJoinedChange.bind(this);
    },

    /**
     * Checks if a module is enabled.
     *
     * @param {string} name Module name.
     *
     * @return {boolean} True if the Module is enabled, false otherwise.
     */
    enabled: function enabled(name) {
      var mod = this._modules.findWhere({ name: name });
      return mod ? mod.get('enabled') : false;
    },

    /**
     * Register an ExtPlug module by require.js module name.
     * This can be anything that is accepted by require.js, including
     * modules using require.js plugins or modules on remote URLs.
     */
    registerModule: function registerModule(id, cb) {
      var _this2 = this;

      require(['extplug/load-module!' + id], function (Mod) {
        var mod = new Mod(id, _this2);
        var meta = new ModuleMeta({
          id: id,
          module: mod,
          name: mod.name
        });
        _this2._modules.add(meta);
        var settings = _this2._getModuleSettings(mod.id);
        mod.settings.set(settings.settings);
        mod.settings.on('change', function () {
          _this2._saveModuleSettings(id);
        });
        if (settings.enabled) {
          _.defer(function () {
            meta.enable();
          });
        }
        if (cb) cb(null);
      }, function (err) {
        if (cb) cb(err);
      });
      return this;
    },

    /**
     * Disables and removes an ExtPlug module.
     */
    unregisterModule: function unregisterModule(id) {
      var mod = this._modules.findWhere({ id: id });
      if (mod) {
        mod.disable();
        this._modules.remove(mod);
      }
    },

    /**
     * Installs a plugin. This is basically registerModule(), but it also
     * remembers the plugin name so it can be loaded again automatically
     * on following ExtPlug runs.
     */
    install: function install(id, cb) {
      this.registerModule(id, function (e) {
        if (e) return cb(e);
        var json = jsonParse(localStorage.getItem(LS_NAME));
        json._installed = (json._installed || []).concat([id]);
        localStorage.setItem(LS_NAME, JSON.stringify(json));
        cb(null);
      });
    },

    /**
     * Disables and removes a plugin forever.
     */
    uninstall: function uninstall(id) {
      this.unregisterModule(id);
      var json = jsonParse(localStorage.getItem(LS_NAME));
      if (json._installed) {
        var i = json._installed.indexOf(id);
        if (i !== -1) {
          json._installed.splice(i, 1);
          localStorage.setItem(LS_NAME, JSON.stringify(json));
        }
      }
    },

    /**
     * Loads installed modules.
     */
    _loadInstalled: function _loadInstalled() {
      var _this3 = this;

      var _jsonParse = jsonParse(localStorage.getItem(LS_NAME));

      var _installed = _jsonParse._installed;

      if (_.isArray(_installed)) {
        (function () {
          var l = _installed.length;
          var i = 0;
          var errors = [];
          var done = function done() {
            if (errors.length) {
              errors.forEach(function (e) {
                Events.trigger('notify', 'icon-chat-system', 'Plugin error: ' + e.message);
              });
            } else if (i > 0) {
              Events.trigger('notify', 'icon-plug-dj', 'ExtPlug: loaded ' + i + ' plugins.');
            }
          };
          _installed.forEach(function (name) {
            _this3.registerModule(name, function (e) {
              if (e) errors.push(e);
              if (++i >= l) {
                done();
              }
            });
          });
        })();
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
    enable: function enable() {
      this._super();
      var ext = this;

      settings.update();
      this.appView = getApplicationView();

      this.document = $(document);

      this.Style({
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

      var pad = function pad(x) {
        return x < 10 ? '0' + x : x;
      };
      var ba = new Date(_package.builtAt);
      var builtAt = ba.getUTCFullYear() + '-' + pad(ba.getUTCMonth() + 1) + '-' + pad(ba.getUTCDate() + 1) + ' ' + pad(ba.getUTCHours() + 1) + ':' + pad(ba.getUTCMinutes() + 1) + ':' + pad(ba.getUTCSeconds() + 1) + ' UTC';
      chatFacade.registerCommand('version', function () {
        API.chatLog('' + _package.name + ' v' + _package.version + ' (' + builtAt + ')');
      });

      // replace rendered UserView
      var userView = new ExtUserView();
      userView.render();
      this.appView.user.$el.replaceWith(userView.$el);
      this.appView.user = userView;

      // Add ExtPlug tab to user settings
      this._settingsTabAdvice = meld.around(UserSettingsView.prototype, 'getMenu', function () {
        return new ExtSettingsTabMenuView();
      });
      this._settingsPaneAdvice = meld.around(UserSettingsView.prototype, 'getView', function (joinpoint) {
        if (joinpoint.args[0] === 'ext-plug') {
          return new ExtSettingsSectionView({
            modules: ext._modules,
            ext: ext
          });
        }
        return joinpoint.proceed();
      });

      // install extra events
      hooks.forEach(function (hook) {
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
                badgeBox.append($('<span />').addClass('emoji-glow extplug-badji').append($('<span />').addClass('emoji emoji-' + emoji.map[emojiName])));
              }
            } else if (/^icon-(.*?)$/.test(message.badge)) {
              var badgeBox = this.$chatMessages.children().last().find('.badge-box');
              badgeBox.find('i').removeClass().addClass('icon').addClass(message.badge);
            }
          }
          if (message.color) {
            this.$chatMessages.children().last().find('.msg .text').css('color', message.color);
          }
        } else {
          joinpoint.proceed(message);
        }
      }

      this.Style({
        '#chat-messages .cm.inline': {
          '.badge-box': {
            margin: '5px 8px 6px',
            height: '17px',
            'border-radius': '0px',
            background: 'transparent',

            // center badge icons
            '.icon': {
              top: '50%',
              'margin-top': '-15px'
            }
          },
          '.from': { display: 'inline' },
          '.text': { display: 'inline', 'margin-left': '5px' }
        },
        '#chat-messages .cm .no-badge .icon': {
          width: '30px',
          height: '30px',
          top: '0px',
          left: '0px',
          border: 'none',
          'border-radius': '0px'
        }
      });

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

      this.document.on('click.extplug', this.onClick);
      currentMedia.on('change:volume', this.onVolume);
      currentRoom.on('change:joined', this.onJoinedChange);

      this._loadInstalled();
      Events.trigger('notify', 'icon-plug-dj', 'ExtPlug v' + _package.version + ' loaded');

      return this;
    },

    /**
     * Deinitializes and cleans up ExtPlug.
     *
     * Everything should be unloaded here, so the Plug.DJ page looks like nothing ever happened.
     */
    disable: function disable() {
      this._modules.forEach(function (mod) {
        mod.disable();
      });
      hooks.forEach(function (hook) {
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
      var chatView = this.appView.room.chat;
      if (chatView) Events.off('chat:receive', chatView.onReceived);
      this._chatTypeAdvice.remove();
      if (chatView) Events.on('chat:receive', chatView.onReceived, chatView);

      // remove room settings handling
      this.roomSettings.dispose();
      // remove events
      this.document.off('.extplug');
      currentMedia.off('change:volume', this.onVolume);
      currentRoom.off('change:joined', this.onJoinedChange);
      this.trigger('deinit');
      this._super();
    },

    /**
     * Persists plugin settings to localStorage.
     * @private
     */
    _saveModuleSettings: function _saveModuleSettings(id) {
      var json = jsonParse(localStorage.getItem(LS_NAME));
      var mod = this._modules.findWhere({ id: id });
      var settings = mod.get('module').settings;
      json[id] = { enabled: mod.get('enabled'), settings: settings };
      localStorage.setItem(LS_NAME, JSON.stringify(json));
    },

    /**
     * Retrieves plugin settings from localStorage.
     */
    _getModuleSettings: function _getModuleSettings(id) {
      var settings = jsonParse(localStorage.getItem(LS_NAME));
      if (settings && id in settings) {
        return settings[id];
      }
      return { enabled: false, settings: {} };
    },

    /**
     * Full-page onclick handler.
     *
     * @param {MouseEvent} e Event.
     *
     * @private
     */
    onClick: function onClick(e) {
      var target = $(e.target);
      if (target.parents('#user-settings').length === 1) {
        settings.update();
      }
    },

    /**
     * Volume change handler.
     *
     * @private
     */
    onVolume: function onVolume() {
      var newVolume = API.getVolume();
      if (settings.get('volume') !== newVolume) {
        settings.set('volume', newVolume);
      }
    },

    /**
     * Room join/leave handler.
     *
     * @private
     */
    onJoinedChange: function onJoinedChange() {
      if (currentRoom.get('joined')) {
        this.trigger('room:joined', currentRoom);
      } else {
        this.trigger('room:left', currentRoom);
      }
    },

    /**
     * 3rd party modules should use `extp.push` to register callbacks or modules
     * for when ExtPlug is loaded.
     * This ensures that modules that are loaded *after* ExtPlug will also register.
     *
     * @param {function()} cb
     */
    push: function push(cb) {
      var _this4 = this;

      if (typeof cb === 'string') {
        this.registerModule(cb);
      } else {
        _.defer(function () {
          cb(_this4);
        });
      }
    }
  });

  module.exports = ExtPlug;
});

'use strict';

define('extplug/modules/autowoot/main', function (require, exports, module) {

  var Module = require('extplug/Module'),
      fnUtils = require('extplug/util/function');

  module.exports = Module.extend({
    name: 'Autowoot',

    init: function init(id, ext) {
      this._super(id, ext);
      fnUtils.bound(this, 'onAdvance');
      fnUtils.bound(this, 'woot');
    },

    enable: function enable() {
      this._super();
      this.wootElement = this.$('#woot');
      this.woot();
      API.on(API.ADVANCE, this.onAdvance);
    },

    disable: function disable() {
      this._super();
      API.off(API.ADVANCE, this.onAdvance);
    },

    woot: function woot() {
      this.wootElement.click();
    },

    onAdvance: function onAdvance() {
      setTimeout(this.woot, 3000 + Math.floor(Math.random() * 5000));
    }

  });
});

(extp = window.extp || []).push('extplug/modules/autowoot/main');
'use strict';

define('extplug/modules/chat-notifications/main', function (require, exports, module) {

  var Module = require('extplug/Module'),
      Events = require('plug/core/Events');

  module.exports = Module.extend({
    name: 'Chat Notifications',

    settings: {
      inline: { type: 'boolean', label: 'Small Notifications', 'default': true },
      userJoin: { type: 'boolean', label: 'User Join', 'default': true },
      userLeave: { type: 'boolean', label: 'User Leave', 'default': true },
      advance: { type: 'boolean', label: 'DJ Advance', 'default': true },
      grab: { type: 'boolean', label: 'Media Grab', 'default': true },
      meh: { type: 'boolean', label: 'Meh Vote', 'default': true }
    },

    init: function init(id, ext) {
      this._super(id, ext);
      this.onJoin = this.onJoin.bind(this);
      this.onLeave = this.onLeave.bind(this);
      this.onAdvance = this.onAdvance.bind(this);
      this.onGrab = this.onGrab.bind(this);
      this.onVote = this.onVote.bind(this);
      this.onInline = this.onInline.bind(this);
    },

    enable: function enable() {
      this._super();
      API.on(API.USER_JOIN, this.onJoin);
      API.on(API.BEFORE_USER_LEAVE, this.onLeave);
      API.on(API.ADVANCE, this.onAdvance);
      API.on(API.GRAB_UPDATE, this.onGrab);
      API.on(API.VOTE_UPDATE, this.onVote);
      this.settings.on('change:inline', this.onInline);
    },

    disable: function disable() {
      this._super();
      API.off(API.USER_JOIN, this.onJoin);
      API.off(API.BEFORE_USER_LEAVE, this.onLeave);
      API.off(API.ADVANCE, this.onAdvance);
      API.off(API.GRAB_UPDATE, this.onGrab);
      API.off(API.VOTE_UPDATE, this.onVote);
    },

    _class: function _class() {
      return 'custom extplug-notification ' + (this.settings.get('inline') ? 'inline ' : '');
    },

    onInline: function onInline() {
      var nots = this.$('#chat-messages .extplug-notification');
      if (this.settings.get('inline')) {
        nots.filter(':not(.extplug-advance)').addClass('inline');
      } else {
        nots.removeClass('inline');
      }
    },

    onJoin: function onJoin(e) {
      if (this.settings.get('userJoin')) {
        Events.trigger('chat:receive', {
          type: this._class() + 'extplug-user-join',
          message: 'joined the room',
          uid: e.id,
          un: e.username,
          color: '#2ECC40',
          badge: 'icon-community-users'
        });
      }
    },

    onLeave: function onLeave(user) {
      if (this.settings.get('userLeave')) {
        Events.trigger('chat:receive', {
          type: this._class() + 'extplug-user-leave',
          message: 'left the room',
          uid: user.id,
          un: user.username,
          color: '#FF851B',
          badge: 'icon-community-users'
        });
      }
    },

    onAdvance: function onAdvance(e) {
      if (this.settings.get('advance')) {
        Events.trigger('chat:receive', {
          type: 'custom extplug-advance',
          message: e.media.author + ' – ' + e.media.title,
          uid: e.dj.id,
          un: e.dj.username,
          color: '#7FDBFF',
          badge: 'icon-play-next'
        });
      }
    },

    onGrab: function onGrab(e) {
      if (this.settings.get('grab')) {
        var media = API.getMedia();
        Events.trigger('chat:receive', {
          type: this._class() + 'extplug-grab',
          message: 'grabbed this track',
          uid: e.user.id,
          un: e.user.username,
          color: '#a670fe',
          badge: 'icon-grab'
        });
      }
    },

    onVote: function onVote(e) {
      if (this.settings.get('meh') && e.vote === -1) {
        Events.trigger('chat:receive', {
          type: this._class() + 'extplug-meh',
          message: 'meh\'d this track',
          uid: e.user.id,
          un: e.user.username,
          color: '#FF4136',
          badge: 'icon-meh'
        });
      }
    }
  });
});

(extp = window.extp || []).push('extplug/modules/chat-notifications/main');
'use strict';

define('extplug/modules/compact-history/main', function (require, exports, module) {

  var Module = require('extplug/Module'),
      fnUtils = require('extplug/util/function'),
      _ = require('underscore'),
      $ = require('jquery');

  module.exports = Module.extend({
    name: 'Compact History',
    description: 'Lays out the room history in a much more compact view.',

    // We'll just use CSS
    enable: function enable() {
      this._super();
      var ITEM_HEIGHT = 20;
      var heightPx = ITEM_HEIGHT + 'px';
      this.Style({
        '#history-panel .media-list.history .playlist-media-item:not(.selected)': {
          height: heightPx
        },
        '#history-panel .media-list.history .playlist-media-item:not(.selected) img': {
          height: heightPx,
          width: ITEM_HEIGHT * 1.5 + 'px',
          'margin-top': '0px'
        },
        '#history-panel .media-list.history .playlist-media-item:not(.selected) .score': {
          height: 'auto',
          width: 'auto',
          top: '0px',
          left: '65px'
        },
        '#history-panel .media-list.history .playlist-media-item:not(.selected) .score .item': {
          'margin-right': '10px'
        },
        '#history-panel .media-list.history .playlist-media-item:not(.selected) .meta': {
          height: 'auto'
        },
        '#history-panel .media-list.history .playlist-media-item:not(.selected) .meta span': {
          height: heightPx,
          top: '0px'
        },
        '#history-panel .media-list.history .playlist-media-item:not(.selected) .actions': {
          height: heightPx,
          top: '0px'
        },
        '#history-panel .media-list.history .playlist-media-item:not(.selected) .author': {
          left: '120px',
          right: '300px',
          width: 'auto'
        },
        '#history-panel .media-list.history .playlist-media-item:not(.selected) .name': {
          right: '125px'
        },
        '#history-panel .media-list.history .playlist-media-item:not(.selected) .actions div': {
          height: heightPx
        },
        '#history-panel .media-list.history .playlist-media-item:not(.selected) .actions div i': {
          top: '-4px'
        }
      });
    }

  });
});

(extp = window.extp || []).push('extplug/modules/compact-history/main');
'use strict';

define('extplug/modules/full-size-video/main', function (require, exports, module) {
  var Module = require('extplug/Module'),
      fnUtils = require('extplug/util/function'),
      win = require('plug/util/window');

  module.exports = Module.extend({
    name: 'Full-Size Video',

    init: function init(id, ext) {
      this._super(id, ext);
      fnUtils.bound(this, 'enter');
      fnUtils.bound(this, 'leave');
    },

    enable: function enable() {
      this._super();
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

    enter: function enter() {
      this.$('#dj-button, #vote').show();
    },
    leave: function leave(e) {
      // don't hide if the new target is one of the buttons
      if (e && e.relatedTarget && $(e.relatedTarget).closest('#dj-button, #vote').length > 0) {
        return;
      }
      this.$('#dj-button, #vote').hide();
    },

    disable: function disable() {
      this._super();
      this.enter();
      this.$('#playback').off('mouseenter', this.enter).off('mouseleave', this.leave);
      setTimeout(function () {
        win.onResize();
      }, 1);
    }

  });
});

(extp = window.extp || []).push('extplug/modules/full-size-video/main');
'use strict';

define('extplug/modules/meh-icon/main', function (require, exports, module) {

  var Module = require('extplug/Module'),
      UserRowView = require('plug/views/rooms/users/RoomUserRowView'),
      $ = require('jquery'),
      meld = require('meld');

  var MehIcon = Module.extend({
    name: 'Meh Icons',

    enable: function enable() {
      this._super();
      this.advice = meld.after(UserRowView.prototype, 'vote', this.showMeh);
      this.Style({
        '#user-lists .list.room .user .icon-meh': {
          top: '-1px',
          right: '9px',
          left: 'auto'
        }
      });
    },

    disable: function disable() {
      this.advice.remove();
      this._super();
    },

    showMeh: function showMeh() {
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

(extp = window.extp || []).push('extplug/modules/meh-icon/main');
'use strict';

define('extplug/modules/rollover-blurbs/main', function (require, exports, module) {

  var Module = require('extplug/Module'),
      fnUtils = require('extplug/util/function'),
      rolloverView = require('plug/views/users/userRolloverView'),
      UserFindAction = require('plug/actions/users/UserFindAction'),
      $ = require('jquery'),
      meld = require('meld');

  var emoji = $('<span />').addClass('emoji-glow').append($('<span />').addClass('emoji emoji-1f4dd'));

  module.exports = Module.extend({
    name: 'Rollover Blurb (Experimental)',
    description: 'Show user "Blurb" / bio in rollover popups.',

    enable: function enable() {
      this._super();
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

      this.showAdvice = meld.around(rolloverView, 'showModal', this.addBlurb);
      this.hideAdivce = meld.before(rolloverView, 'hide', this.removeBlurb);
    },

    disable: function disable() {
      this._super();
      this.showAdvice.remove();
      this.hideAdvice.remove();
    },

    addBlurb: function addBlurb(joinpoint) {
      this.$('.extplug-blurb-wrap').remove();
      var self = this;
      var span = $('<span />').addClass('extplug-blurb');
      var div = $('<div />').addClass('info extplug-blurb-wrap').append(span);
      if (this.user.get('blurb')) {
        show(this.user.get('blurb'));
      } else {
        new UserFindAction(this.user.get('id')).on('success', function (user) {
          if (user.blurb) {
            self.user.set('blurb', user.blurb);
            show(user.blurb);
          }
        });
      }
      return joinpoint.proceed();

      function show(blurb) {
        if (blurb) {
          self.$('.actions').before(div);
          span.append(emoji, ' ' + blurb);
          div.height(span[0].offsetHeight + 6);
          self.$el.css('top', parseInt(self.$el.css('top'), 10) - div.height() + 'px');
        }
      }
    },
    removeBlurb: function removeBlurb() {
      this.$('.extplug-blurb-wrap').remove();
    }

  });
});

(extp = window.extp || []).push('extplug/modules/rollover-blurbs/main');
'use strict';

define('extplug/modules/room-styles/main', function (require, exports, module) {

  var Module = require('extplug/Module'),
      request = require('extplug/util/request'),
      fnUtils = require('extplug/util/function'),
      _ = require('underscore'),
      $ = require('jquery');

  module.exports = Module.extend({
    name: 'Room Styles',

    init: function init(id, ext) {
      this._super(id, ext);
      fnUtils.bound(this, 'colors');
      fnUtils.bound(this, 'css');
      fnUtils.bound(this, 'images');
      fnUtils.bound(this, 'unload');
      fnUtils.bound(this, 'reload');
    },

    enable: function enable() {
      this._super();
      this.all();

      this.ext.roomSettings.on('change', this.reload);

      this.ext.on('room:left', this.unload);
    },

    disable: function disable() {
      this._super();
      this.ext.roomSettings.off('change', this.reload);

      this.ext.off('room:left', this.unload);
    },

    reload: function reload() {
      this.unload();
      this.all();
    },

    colors: function colors() {
      var colors = this.ext.roomSettings.get('colors');
      if (_.isObject(colors)) {
        var colorStyles = this.Style();

        if (_.isObject(colors.chat)) {
          ['admin', 'ambassador', 'host', 'cohost', 'manager', 'bouncer', 'dj'].forEach(function (level) {
            if (colors.chat[level]) {
              var value = { color: '#' + colors.chat[level] + ' !important' };
              colorStyles.set('#chat-messages .icon-chat-' + level + ' ~ .un', value).set('#user-rollover .icon-chat-' + level + ' + span', value).set('#user-lists    .icon-chat-' + level + ' + span', value).set('#waitlist      .icon-chat-' + level + ' + span', value);
            }
          });
        }
      }
    },

    css: function css() {
      var css = this.ext.roomSettings.get('css');
      if (_.isObject(css)) {
        if (_.isObject(css.rule)) {
          this.Style(css.rule);
        }

        if (_.isArray(css['import'])) {
          this._imports = $('<style>').text(css['import'].map(function (url) {
            return '@import url(' + request.url(url) + ');';
          }).join('\n'));
        }
      }
    },

    images: function images() {
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
            background: 'url(' + images.booth + ') no-repeat center center',
            position: 'absolute',
            width: '300px',
            height: '100px',
            left: '15px',
            top: '70px',
            'z-index': -1
          }).appendTo(this.$('#dj-booth'));
        }
      }
    },

    all: function all() {
      this.colors();
      this.css();
      this.images();
    },

    unload: function unload() {
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

(extp = window.extp || []).push('extplug/modules/room-styles/main');
'use strict';

;(function _initExtPlug() {

  if (window.API) {
    require(['extplug/boot']);
  } else {
    setTimeout(_initExtPlug, 20);
  }
})();