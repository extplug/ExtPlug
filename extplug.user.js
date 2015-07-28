// ==UserScript==
// @name        ExtPlug
// @description Highly flexible, modular userscript extension for plug.dj.
// @version     0.13.4
// @match       https://plug.dj/*
// @namespace   https://extplug.github.io/
// @downloadURL https://extplug.github.io/ExtPlug/extplug.user.js
// @updateURL   https://extplug.github.io/ExtPlug/extplug.user.js
// @grant       none
// ==/UserScript==

/**
 * ExtPlug loader. Waits for the necessary plug.dj code to load before running
 * ExtPlug.
 */

;(function load() {

  window._load = load

  if (window.require && window.define && window.API) {
    (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

if (!require('./is-implemented')()) {
	Object.defineProperty(require('es5-ext/global'), 'Symbol',
		{ value: require('./polyfill'), configurable: true, enumerable: false,
			writable: true });
}

},{"./is-implemented":2,"./polyfill":18,"es5-ext/global":5}],2:[function(require,module,exports){
'use strict';

module.exports = function () {
	var symbol;
	if (typeof Symbol !== 'function') return false;
	symbol = Symbol('test symbol');
	try { String(symbol); } catch (e) { return false; }
	if (typeof Symbol.iterator === 'symbol') return true;

	// Return 'true' for polyfills
	if (typeof Symbol.isConcatSpreadable !== 'object') return false;
	if (typeof Symbol.iterator !== 'object') return false;
	if (typeof Symbol.toPrimitive !== 'object') return false;
	if (typeof Symbol.toStringTag !== 'object') return false;
	if (typeof Symbol.unscopables !== 'object') return false;

	return true;
};

},{}],3:[function(require,module,exports){
'use strict';

module.exports = function (x) {
	return (x && ((typeof x === 'symbol') || (x['@@toStringTag'] === 'Symbol'))) || false;
};

},{}],4:[function(require,module,exports){
'use strict';

var assign        = require('es5-ext/object/assign')
  , normalizeOpts = require('es5-ext/object/normalize-options')
  , isCallable    = require('es5-ext/object/is-callable')
  , contains      = require('es5-ext/string/#/contains')

  , d;

d = module.exports = function (dscr, value/*, options*/) {
	var c, e, w, options, desc;
	if ((arguments.length < 2) || (typeof dscr !== 'string')) {
		options = value;
		value = dscr;
		dscr = null;
	} else {
		options = arguments[2];
	}
	if (dscr == null) {
		c = w = true;
		e = false;
	} else {
		c = contains.call(dscr, 'c');
		e = contains.call(dscr, 'e');
		w = contains.call(dscr, 'w');
	}

	desc = { value: value, configurable: c, enumerable: e, writable: w };
	return !options ? desc : assign(normalizeOpts(options), desc);
};

d.gs = function (dscr, get, set/*, options*/) {
	var c, e, options, desc;
	if (typeof dscr !== 'string') {
		options = set;
		set = get;
		get = dscr;
		dscr = null;
	} else {
		options = arguments[3];
	}
	if (get == null) {
		get = undefined;
	} else if (!isCallable(get)) {
		options = get;
		get = set = undefined;
	} else if (set == null) {
		set = undefined;
	} else if (!isCallable(set)) {
		options = set;
		set = undefined;
	}
	if (dscr == null) {
		c = true;
		e = false;
	} else {
		c = contains.call(dscr, 'c');
		e = contains.call(dscr, 'e');
	}

	desc = { get: get, set: set, configurable: c, enumerable: e };
	return !options ? desc : assign(normalizeOpts(options), desc);
};

},{"es5-ext/object/assign":6,"es5-ext/object/is-callable":9,"es5-ext/object/normalize-options":13,"es5-ext/string/#/contains":15}],5:[function(require,module,exports){
'use strict';

module.exports = new Function("return this")();

},{}],6:[function(require,module,exports){
'use strict';

module.exports = require('./is-implemented')()
	? Object.assign
	: require('./shim');

},{"./is-implemented":7,"./shim":8}],7:[function(require,module,exports){
'use strict';

module.exports = function () {
	var assign = Object.assign, obj;
	if (typeof assign !== 'function') return false;
	obj = { foo: 'raz' };
	assign(obj, { bar: 'dwa' }, { trzy: 'trzy' });
	return (obj.foo + obj.bar + obj.trzy) === 'razdwatrzy';
};

},{}],8:[function(require,module,exports){
'use strict';

var keys  = require('../keys')
  , value = require('../valid-value')

  , max = Math.max;

module.exports = function (dest, src/*, …srcn*/) {
	var error, i, l = max(arguments.length, 2), assign;
	dest = Object(value(dest));
	assign = function (key) {
		try { dest[key] = src[key]; } catch (e) {
			if (!error) error = e;
		}
	};
	for (i = 1; i < l; ++i) {
		src = arguments[i];
		keys(src).forEach(assign);
	}
	if (error !== undefined) throw error;
	return dest;
};

},{"../keys":10,"../valid-value":14}],9:[function(require,module,exports){
// Deprecated

'use strict';

module.exports = function (obj) { return typeof obj === 'function'; };

},{}],10:[function(require,module,exports){
'use strict';

module.exports = require('./is-implemented')()
	? Object.keys
	: require('./shim');

},{"./is-implemented":11,"./shim":12}],11:[function(require,module,exports){
'use strict';

module.exports = function () {
	try {
		Object.keys('primitive');
		return true;
	} catch (e) { return false; }
};

},{}],12:[function(require,module,exports){
'use strict';

var keys = Object.keys;

module.exports = function (object) {
	return keys(object == null ? object : Object(object));
};

},{}],13:[function(require,module,exports){
'use strict';

var forEach = Array.prototype.forEach, create = Object.create;

var process = function (src, obj) {
	var key;
	for (key in src) obj[key] = src[key];
};

module.exports = function (options/*, …options*/) {
	var result = create(null);
	forEach.call(arguments, function (options) {
		if (options == null) return;
		process(Object(options), result);
	});
	return result;
};

},{}],14:[function(require,module,exports){
'use strict';

module.exports = function (value) {
	if (value == null) throw new TypeError("Cannot use null or undefined");
	return value;
};

},{}],15:[function(require,module,exports){
'use strict';

module.exports = require('./is-implemented')()
	? String.prototype.contains
	: require('./shim');

},{"./is-implemented":16,"./shim":17}],16:[function(require,module,exports){
'use strict';

var str = 'razdwatrzy';

module.exports = function () {
	if (typeof str.contains !== 'function') return false;
	return ((str.contains('dwa') === true) && (str.contains('foo') === false));
};

},{}],17:[function(require,module,exports){
'use strict';

var indexOf = String.prototype.indexOf;

module.exports = function (searchString/*, position*/) {
	return indexOf.call(this, searchString, arguments[1]) > -1;
};

},{}],18:[function(require,module,exports){
'use strict';

var d              = require('d')
  , validateSymbol = require('./validate-symbol')

  , create = Object.create, defineProperties = Object.defineProperties
  , defineProperty = Object.defineProperty, objPrototype = Object.prototype
  , Symbol, HiddenSymbol, globalSymbols = create(null);

var generateName = (function () {
	var created = create(null);
	return function (desc) {
		var postfix = 0, name;
		while (created[desc + (postfix || '')]) ++postfix;
		desc += (postfix || '');
		created[desc] = true;
		name = '@@' + desc;
		defineProperty(objPrototype, name, d.gs(null, function (value) {
			defineProperty(this, name, d(value));
		}));
		return name;
	};
}());

HiddenSymbol = function Symbol(description) {
	if (this instanceof HiddenSymbol) throw new TypeError('TypeError: Symbol is not a constructor');
	return Symbol(description);
};
module.exports = Symbol = function Symbol(description) {
	var symbol;
	if (this instanceof Symbol) throw new TypeError('TypeError: Symbol is not a constructor');
	symbol = create(HiddenSymbol.prototype);
	description = (description === undefined ? '' : String(description));
	return defineProperties(symbol, {
		__description__: d('', description),
		__name__: d('', generateName(description))
	});
};
defineProperties(Symbol, {
	for: d(function (key) {
		if (globalSymbols[key]) return globalSymbols[key];
		return (globalSymbols[key] = Symbol(String(key)));
	}),
	keyFor: d(function (s) {
		var key;
		validateSymbol(s);
		for (key in globalSymbols) if (globalSymbols[key] === s) return key;
	}),
	hasInstance: d('', Symbol('hasInstance')),
	isConcatSpreadable: d('', Symbol('isConcatSpreadable')),
	iterator: d('', Symbol('iterator')),
	match: d('', Symbol('match')),
	replace: d('', Symbol('replace')),
	search: d('', Symbol('search')),
	species: d('', Symbol('species')),
	split: d('', Symbol('split')),
	toPrimitive: d('', Symbol('toPrimitive')),
	toStringTag: d('', Symbol('toStringTag')),
	unscopables: d('', Symbol('unscopables'))
});
defineProperties(HiddenSymbol.prototype, {
	constructor: d(Symbol),
	toString: d('', function () { return this.__name__; })
});

defineProperties(Symbol.prototype, {
	toString: d(function () { return 'Symbol (' + validateSymbol(this).__description__ + ')'; }),
	valueOf: d(function () { return validateSymbol(this); })
});
defineProperty(Symbol.prototype, Symbol.toPrimitive, d('',
	function () { return validateSymbol(this); }));
defineProperty(Symbol.prototype, Symbol.toStringTag, d('c', 'Symbol'));

defineProperty(HiddenSymbol.prototype, Symbol.toPrimitive,
	d('c', Symbol.prototype[Symbol.toPrimitive]));
defineProperty(HiddenSymbol.prototype, Symbol.toStringTag,
	d('c', Symbol.prototype[Symbol.toStringTag]));

},{"./validate-symbol":19,"d":4}],19:[function(require,module,exports){
'use strict';

var isSymbol = require('./is-symbol');

module.exports = function (value) {
	if (!isSymbol(value)) throw new TypeError(value + " is not a symbol");
	return value;
};

},{"./is-symbol":3}]},{},[1]);

;(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define('plug-modules',[ 'underscore' ], factory);
  }
  else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('underscore'))
  }
  else {
    // Browser globals
    root.plugModules = factory(root._);
  }
}(this, function (_) {

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

/**
 * The Context keeps track of the long names, and provides some convenience methods
 * for working with renamed modules.
 */
function Context(target) {
  this._nameMapping = {};
  this._notFound = [];
  this._detectives = [];
  this._ran = false;
  this.target = target
  if (!target) try {
    this.target = requirejs.s.contexts._.defined;
  }
  catch (e) {
    this.target = null
  }
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
  var defined = this.target;
  return defined[path] || (this._nameMapping[path] && this.require(this._nameMapping[path])) || undefined;
};
Context.prototype.isDefined = function (path) {
  return typeof this.require(path) !== 'undefined';
};
Context.prototype.define = function (newPath, oldPath) {
  this._nameMapping[newPath] = oldPath;
  this.require(oldPath).__plugModule = newPath
  return this;
};
Context.prototype.setNotFound = function (path) {
  this._notFound.push(path);
};
Context.prototype.getUnknownModules = function () {
  var knownModules = _.values(this._nameMapping);
  var allModules = _.keys(this.target).filter(function (moduleName) {
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
    this.target[newName] = this.require(newName);
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
  var defines = context.target;
  var fn = this.fn;
  for (var name in defines) if (defines.hasOwnProperty(name)) {
    try {
      if (defines[name] && !defines[name].__plugModule &&
          this.match(context, defines[name], name)) {
        return name;
      }
    }
    catch (e) {}
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
    var defines = context.target,
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
function ActionMatcher(method, url, regex, params) {
  Matcher.call(this);

  this._method = method.toUpperCase();
  this._url = url;
  this._regex = regex;
  this._params = params || [];
  this._fakeInstance = {};
  Object.defineProperty(this._fakeInstance, '_super', {
    get: function () {
      // fake _super method
      return function () {};
    },
    set: function () {
      // ignore
    }
  });
}
ActionMatcher.prototype = Object.create(Matcher.prototype);
ActionMatcher.prototype.match = function (context, module, name) {
  if (module.prototype && module.prototype.type === this._method) {
    if (this._url) {
      return module.prototype.route === this._url;
    }
    else if (this._regex) {
      module.prototype.init.apply(this._fakeInstance, this._params);
      return typeof this._regex === 'string'
        ? this._fakeInstance.route.indexOf(this._regex) === 0
        : this._regex.test(this._fakeInstance.route);
    }
  }
  return false;
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
  'plug/actions/auth/LoginAction': new ActionMatcher('POST', 'auth/login'),
  'plug/actions/bans/BanAction': new ActionMatcher('POST', 'bans/add'),
  'plug/actions/bans/ListBansAction': new ActionMatcher('GET', 'bans'),
  'plug/actions/bans/UnbanAction': new ActionMatcher('DELETE', null, 'bans/'),
  'plug/actions/booth/JoinWaitlistAction': new ActionMatcher('POST', 'booth'),
  'plug/actions/booth/LeaveWaitlistAction': new ActionMatcher('DELETE', 'booth'),
  'plug/actions/booth/ModerateAddDJAction': new ActionMatcher('POST', 'booth/add'),
  'plug/actions/booth/ModerateForceSkipAction': new ActionMatcher('POST', 'booth/skip'),
  'plug/actions/booth/ModerateRemoveDJAction': new ActionMatcher('DELETE', null, 'booth/remove/'),
  'plug/actions/booth/SkipTurnAction': new ActionMatcher('POST', 'booth/skip/me'),
  'plug/actions/booth/BoothLockAction': new ActionMatcher('PUT', 'booth/lock'),
  'plug/actions/booth/BoothMoveAction': new ActionMatcher('POST', 'booth/move'),
  'plug/actions/booth/BoothSetCycleAction': new ActionMatcher('PUT', 'booth/cycle'),
  'plug/actions/friends/BefriendAction': new ActionMatcher('POST', 'friends'),
  'plug/actions/friends/ListFriendsAction': new ActionMatcher('GET', 'friends'),
  'plug/actions/friends/ListInvitesAction': new ActionMatcher('GET', 'friends/invites'),
  'plug/actions/friends/IgnoreRequestAction': new ActionMatcher('PUT', 'friends/ignore'),
  'plug/actions/friends/UnfriendAction': new ActionMatcher('DELETE', null, 'friends/'),
  'plug/actions/ignores/IgnoreAction': new ActionMatcher('POST', 'ignores'),
  'plug/actions/ignores/UnignoreAction': new ActionMatcher('DELETE', null, 'ignores/'),
  'plug/actions/ignores/IgnoresListAction': new ActionMatcher('GET', 'ignores'),
  'plug/actions/media/ListMediaAction': new ActionMatcher('GET', null, 'playlists/'),
  'plug/actions/media/MediaDeleteAction': new ActionMatcher('POST', null, /\/media\/delete$/),
  'plug/actions/media/MediaGrabAction': new ActionMatcher('POST', 'grabs'),
  'plug/actions/media/MediaInsertAction': new ActionMatcher('POST', null, /\/media\/insert$/, [ null, [], null ]),
  'plug/actions/media/MediaMoveAction': new ActionMatcher('PUT', null, /\/media\/move$/, [ null, [], null ]),
  'plug/actions/media/MediaUpdateAction': new ActionMatcher('PUT', null, /\/media\/update$/),
  'plug/actions/mutes/MuteAction': new ActionMatcher('POST', 'mutes'),
  'plug/actions/mutes/UnmuteAction': new ActionMatcher('DELETE', null, 'mutes/'),
  'plug/actions/mutes/MutesListAction': new ActionMatcher('GET', 'mutes'),
  'plug/actions/news/NewsListAction': new ActionMatcher('GET', 'news'),
  'plug/actions/notifications/NotificationReadAction': new ActionMatcher('DELETE', null, 'notifications/'),
  'plug/actions/playlists/ListPlaylistsAction': new ActionMatcher('GET', 'playlists'),
  'plug/actions/playlists/PlaylistActivateAction': new ActionMatcher('PUT', null, /\/activate$/),
  'plug/actions/playlists/PlaylistCreateAction': new ActionMatcher('POST', 'playlists'),
  'plug/actions/playlists/PlaylistDeleteAction': new ActionMatcher('DELETE', null, 'playlists/'),
  'plug/actions/playlists/PlaylistRenameAction': new ActionMatcher('PUT', null, /\/rename$/),
  'plug/actions/playlists/PlaylistShuffleAction': new ActionMatcher('PUT', null, /\/shuffle$/),
  'plug/actions/profile/SetBlurbAction': new ActionMatcher('PUT', 'profile/blurb'),
  'plug/actions/rooms/ListFavoritesAction': new ActionMatcher('GET', null, 'rooms/favorites'),
  'plug/actions/rooms/ListMyRoomsAction': new ActionMatcher('GET', 'rooms/me'),
  'plug/actions/rooms/ListRoomsAction': new ActionMatcher('GET', null, 'rooms?q='),
  'plug/actions/rooms/ModerateDeleteChatAction': new ActionMatcher('DELETE', null, 'chat/'),
  'plug/actions/rooms/RoomCreateAction': new ActionMatcher('POST', 'rooms'),
  'plug/actions/rooms/RoomFavoriteAction': new ActionMatcher('POST', 'rooms/favorites'),
  'plug/actions/rooms/RoomHistoryAction': new ActionMatcher('GET', 'rooms/history'),
  'plug/actions/rooms/RoomJoinAction': new ActionMatcher('POST', 'rooms/join'),
  'plug/actions/rooms/RoomStateAction': new ActionMatcher('GET', 'rooms/state'),
  'plug/actions/rooms/RoomUnfavoriteAction': new ActionMatcher('DELETE', null, 'rooms/favorites'),
  'plug/actions/rooms/RoomUpdateAction': new ActionMatcher('POST', 'rooms/update'),
  'plug/actions/rooms/RoomValidateAction': new ActionMatcher('GET', null, 'rooms/validate'),
  'plug/actions/rooms/SOSAction': new ActionMatcher('POST', 'rooms/sos'),
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
  'plug/actions/staff/StaffRemoveAction': new ActionMatcher('DELETE', null, 'staff/'),
  'plug/actions/staff/StaffUpdateAction': new ActionMatcher('POST', 'staff/update'),
  'plug/actions/store/ChangeUsernameAction': new ActionMatcher('POST', 'store/purchase/username'),
  'plug/actions/store/PurchaseAction': new ActionMatcher('POST', 'store/purchase'),
  'plug/actions/store/ProductsAction': new ActionMatcher('GET', null, 'store/products'),
  'plug/actions/store/InventoryAction': new ActionMatcher('GET', null, 'store/inventory'),
  'plug/actions/users/ValidateNameAction': new ActionMatcher('GET', null, 'users/validate/'),
  'plug/actions/users/SetLanguageAction': new ActionMatcher('PUT', 'users/language'),
  'plug/actions/users/SetAvatarAction': new ActionMatcher('PUT', 'users/avatar'),
  'plug/actions/users/SetBadgeAction': new ActionMatcher('PUT', 'users/badge'),
  'plug/actions/users/MeAction': new ActionMatcher('GET', 'users/me'),
  'plug/actions/users/ListTransactionsAction': new ActionMatcher('GET', 'users/me/transactions'),
  'plug/actions/users/UserHistoryAction': new ActionMatcher('GET', 'users/me/history'),
  'plug/actions/users/UserFindAction': new ActionMatcher('GET', null, 'users/'),
  'plug/actions/users/BulkFindAction': new ActionMatcher('POST', 'users/bulk'),
  'plug/actions/users/SendGiftAction': new ActionMatcher('POST', 'gift'),
  'plug/actions/users/SaveSettingsAction': new ActionMatcher('PUT', 'users/settings'),
  'plug/actions/users/SignupAction': new ActionMatcher('POST', 'users/signup'),
  'plug/actions/youtube/YouTubePlaylistService': function (m) {
    return _.isFunction(m) && _.isFunction(m.prototype.sortByName) && _.isFunction(m.prototype.next);
  },
  'plug/actions/youtube/YouTubeImportService': function (m) {
    return _.isFunction(m) && _.isFunction(m.prototype.getURL) && _.isFunction(m.prototype.next);
  },
  'plug/actions/youtube/YouTubeSearchService': function (m) {
    return _.isFunction(m) && _.isFunction(m.prototype.onList) &&
      _.isFunction(m.prototype.onVideos);
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
  'plug/core/AsyncHandler': function (m) {
    // subclass of EventHandler
    return _.isFunction(m) && m.prototype.hasOwnProperty('listenTo') && m.prototype.hasOwnProperty('finish');
  },

  'plug/store/settings': function (m) {
    return _.isObject(m.settings);
  },
  'plug/store/media': function (m) {
    return _.isFunction(m.deleteOrphans);
  },
  'plug/store/compress': function (m) {
    return _.isFunction(m.compress);
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
  'plug/collections/restrictedMediaAlternatives': new StepwiseMatcher({
    setup: function () {
      var RSHandler = this.require('plug/handlers/RestrictedSearchHandler');
      // the restricted search result handler resets the searchResults
      // array
      RSHandler.prototype.onResult.call(
        { finish: function () {} },
        [ {
          id: -1000,
          author: 'plug-modules',
          title: 'Test item used to find the right collection.'
        } ]
      );
    },
    check: function (m) {
      return isCollectionOf(m, this.require('plug/models/Media')) &&
        m.last().get('id') === -1000;
    },
    cleanup: function (searchResults) {
      // we cannot get back the original search results, unfortunately,
      // without re-running the search query (which may be possible, but
      // is a little expensive)
    }
  }).needs('plug/handlers/RestrictedSearchHandler', 'plug/models/Media'),
  'plug/collections/relatedMedia': new SimpleMatcher(function (m) {
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
      m.comparator === this.require('plug/util/comparators').staff;
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
  'plug/facades/searchFacade': function (m) {
    return _.isFunction(m.appendUnknown) && _.isFunction(m.resetRelated);
  },
  'plug/facades/relatedMediaFacade': new SimpleFetcher(function (m) {
    return this.require('plug/facades/searchFacade');
  }).needs('plug/facades/searchFacade'),
  'plug/facades/remoteMediaFacade': function (m) {
    return _.isFunction(m.ytSearch) && _.isFunction(m.ytRelated) && _.isFunction(m.scPermalink);
  },
  'plug/facades/playlistsSearchFacade': function (m) {
    return _.isFunction(m.setQuery) && _.isFunction(m.onHistory);
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
      _.isFunction(m.prototype.onResize) &&
      viewHasElement(m, '.playlist-overlay-help');
  },
  'plug/views/playlists/import/PlaylistImportPanelView': function (m) {
    return isView(m) && m.prototype.id === 'playlist-import-panel';
  },
  'plug/views/playlists/media/headers/MediaHeaderView': function (m) {
    return isView(m) && m.prototype.className === 'header' &&
      !('template' in m.prototype);
  },
  'plug/views/playlists/media/headers/ImportHeaderView': function (m) {
    return isView(m) && m.prototype.className === 'header import' &&
      m.prototype.template === this.require('hbs!templates/playlist/media/headers/ImportHeader')();
  },
  'plug/views/playlists/media/headers/PlaylistMediaHeaderView': function (m) {
    return isView(m) && m.prototype.className === 'header no-icon' &&
      _.isFunction(m.prototype.onShuffleClick);
  },
  'plug/views/playlists/media/headers/PlaylistSearchHeader': function (m) {
    return isView(m) && !_.isFunction(m.prototype.onQueryUpdate) &&
      m.prototype.template === this.require('hbs!templates/playlist/media/headers/SearchMediaHeader')();
  },
  'plug/views/playlists/media/headers/SearchRelatedHeader': function (m) {
    return isView(m) && m.prototype.className === 'header with-back' &&
      _.isFunction(m.prototype.onBackClick);
  },
  'plug/views/playlists/media/headers/YouTubePlaylistsHeader': function (m) {
    var Lang = this.require('lang/Lang');
    return isView(m) && m.prototype.className === 'header import' &&
      m.prototype.template === this.require('hbs!templates/playlist/media/headers/ImportYouTubePlaylistsHeader')(Lang);
  },
  'plug/views/playlists/media/headers/SimpleTitleHeader': function (m) {
    return isView(m) && m.prototype.className === 'header' &&
      m.prototype.template === this.require('hbs!templates/playlist/media/headers/SimpleTitleHeader')();
  },
  'plug/views/playlists/media/headers/YouTubeMediaHeader': function (m) {
    return isView(m) && m.prototype.className === 'header import-with-back' &&
      _.isFunction(m.prototype.onImportClick) &&
      _.isFunction(m.prototype.onImport) &&
      _.isFunction(m.prototype.onBackClick);
  },
  'plug/views/playlists/media/headers/SoundCloudSetsHeader': function (m) {
    var Lang = this.require('lang/Lang');
    return isView(m) && m.prototype.className === 'header import' &&
      _.isFunction(m.prototype.onImportClick) &&
      m.prototype.template === this.require('hbs!templates/playlist/media/headers/ImportSoundCloudSetsHeader')(Lang);
  },
  'plug/views/playlists/media/headers/SearchMediaHeader': function (m) {
    return isView(m) && _.isFunction(m.prototype.onQueryUpdate) &&
      m.prototype.template === this.require('hbs!templates/playlist/media/headers/SearchMediaHeader')();
  },
  // iffy naming below:
  'plug/views/playlists/media/headers/SoundCloudMediaHeader': function (m) {
    return isView(m) && m.prototype.className === 'header import-with-back' &&
      _.isFunction(m.prototype.onImportClick) &&
      !_.isFunction(m.prototype.onImport) &&
      _.isFunction(m.prototype.onBackClick);
  },
  'plug/views/playlists/media/headers/SoundCloudTracksHeader': function (m) {
    var Lang = this.require('lang/Lang');
    return isView(m) && m.prototype.className === 'header import' &&
      _.isFunction(m.prototype.onImportClick) &&
      m.prototype.template === this.require('hbs!templates/playlist/media/headers/ImportSoundCloudHeader')(Lang);
  },
  'plug/views/playlists/media/MediaPanelView': function (m) {
    // TODO ensure that there are no other modules that match this footprint
    return isView(m) && m.prototype.id === 'media-panel';
  },
  'plug/views/playlists/media/panels/MediaActionsView': function (m) {
    return isView(m) && m.prototype.className === 'actions';
  },
  'plug/views/playlists/media/panels/ImportPlaylistsPanelView': function (m) {
    return isView(m) &&
      !m.prototype.collection &&
      m.prototype.className &&
      m.prototype.className.indexOf('import-playlist-list') > -1;
  },
  'plug/views/playlists/media/panels/YouTubePlaylistsPanelView': new SimpleMatcher(function (m) {
    var youTubePlaylists = this.require('plug/collections/youTubePlaylists');
    return isView(m) && m.prototype.collection === youTubePlaylists &&
      m.prototype.className &&
      m.prototype.className.indexOf('import-playlist-list') !== -1;
  }).needs('plug/collections/youTubePlaylists'),
  'plug/views/playlists/media/panels/YouTubePlaylistsRowView': new SimpleFetcher(function () {
    var Panel = this.require('plug/views/playlists/media/panels/YouTubePlaylistsPanelView');
    return Panel.prototype.RowClass;
  }).needs('plug/views/playlists/media/panels/YouTubePlaylistsPanelView'),
  'plug/views/playlists/media/panels/YouTubePlaylistPanelView': new SimpleMatcher(function (m) {
    return isView(m) &&
      m.prototype.listClass === 'import-media' &&
      m.prototype.collection === this.require('plug/collections/youTubePlaylist');
  }).needs('plug/collections/youTubePlaylist'),
  'plug/views/playlists/media/panels/YouTubePlaylistRowView': new SimpleFetcher(function () {
    var Panel = this.require('plug/views/playlists/media/panels/YouTubePlaylistPanelView');
    return Panel.prototype.RowClass;
  }).needs('plug/views/playlists/media/panels/YouTubePlaylistPanelView'),
  'plug/views/playlists/media/panels/PlaylistSearchPanelView': new SimpleMatcher(function (m) {
    return isView(m) &&
      m.prototype.listClass === 'search-playlists' &&
      m.prototype.collection === this.require('plug/collections/playlistSearchResults');
  }).needs('plug/collections/playlistSearchResults'),
  'plug/views/playlists/media/panels/PlaylistSearchRowView': new SimpleFetcher(function () {
    var Panel = this.require('plug/views/playlists/media/panels/PlaylistSearchPanelView');
    return Panel.prototype.RowClass;
  }).needs('plug/views/playlists/media/panels/PlaylistSearchPanelView'),
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
  'plug/views/users/inventory/AvatarsDropdownView': new SimpleMatcher(function (m, name) {
    return isView(m) && m.prototype.className === 'dropdown' &&
      this.isInSameNamespace(name, 'plug/views/users/inventory/InventoryView') &&
      // the avatars and badges dropdowns are nearly identical, their only verifiable
      // difference is in the select() method. the avatars dropdown has an odd special
      // case for Rave avatars.
      functionContains(m.prototype.select, 'rhc');
  }).needs('plug/views/users/inventory/InventoryView'),
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
  'plug/views/users/inventory/BadgesDropdownView': new SimpleMatcher(function (m, name) {
    return isView(m) && m.prototype.tagName === 'dl' &&
      this.isInSameNamespace(name, 'plug/views/users/inventory/InventoryView') &&
      // inverse of the avatars dropdown check
      !functionContains(m.prototype.select, 'rhc');
  }).needs('plug/views/users/inventory/InventoryView'),
  'plug/views/users/inventory/TransactionHistoryView': new SimpleMatcher(function (m, name) {
    return isView(m) && m.prototype.className === 'history' &&
     functionContains(m.prototype.render, 'GET_USER_TRANSACTIONS') &&
     this.isInSameNamespace(name, 'plug/views/users/inventory/InventoryView');
  }).needs('plug/views/users/inventory/InventoryView'),
  'plug/views/users/inventory/TransactionRowView': new SimpleMatcher(function (m, name) {
    return isView(m) && m.prototype.className === 'row' &&
      this.isInSameNamespace(name, 'plug/views/users/inventory/InventoryView');
  }).needs('plug/views/users/inventory/InventoryView'),
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
  'plug/views/users/store/StoreCategoryView': new SimpleFetcher(function () {
    // AvatarsView is a subclass of the CategoryView.
    var AvatarsView = this.require('plug/views/users/store/AvatarsView');
    return Object.getPrototypeOf(AvatarsView.prototype).constructor;
  }).needs('plug/views/users/store/AvatarsView'),
  'plug/views/users/store/AvatarsView': new SimpleMatcher(function (m) {
    return isView(m) && m.prototype.className === 'avatars' &&
      m.prototype.collection === this.require('plug/collections/purchasableAvatars');
  }).needs('plug/collections/purchasableAvatars'),
  'plug/views/users/store/AvatarCellView': new SimpleFetcher(function () {
    var AvatarsView = this.require('plug/views/users/store/AvatarsView');
    var cellInst = AvatarsView.prototype.getCell(null);
    var AvatarCellView = cellInst.constructor;
    cellInst.destroy();
    return AvatarCellView;
  }).needs('plug/views/users/store/AvatarsView'),
  'plug/views/users/store/AvatarsDropdownView': new SimpleMatcher(function (m, name) {
    // exact duplicate of ../inventory/AvatarsDropdownView
    // ...
    return isView(m) && m.prototype.tagName === 'dl' &&
      this.isInSameNamespace(name, 'plug/views/users/store/StoreView') &&
      // see ../inventory/AvatarsDropdownView
      functionContains(m.prototype.select, 'rhc');
  }).needs('plug/views/users/store/StoreView'),
  'plug/views/users/store/BadgesView': new SimpleMatcher(function (m) {
    return isView(m) && m.prototype.className === 'badges' &&
      m.prototype.collection === this.require('plug/collections/purchasableBadges');
  }).needs('plug/collections/purchasableBadges'),
  'plug/views/users/store/BadgeCellView': new SimpleFetcher(function () {
    var BadgesView = this.require('plug/views/users/store/BadgesView');
    var cellInst = BadgesView.prototype.getCell(null);
    var BadgeCellView = cellInst.constructor;
    cellInst.destroy();
    return BadgeCellView;
  }).needs('plug/views/users/store/BadgesView'),
  'plug/views/users/store/BadgesDropdownView': new SimpleMatcher(function (m, name) {
    return isView(m) && m.prototype.tagName === 'dl' &&
      this.isInSameNamespace(name, 'plug/views/users/store/StoreView') &&
      // inverse of the avatars dropdown check
      !functionContains(m.prototype.select, 'rhc');
  }).needs('plug/views/users/store/StoreView'),
  'plug/views/users/store/MiscView': new SimpleMatcher(function (m) {
    return isView(m) && m.prototype.className === 'misc' &&
      m.prototype.collection === this.require('plug/collections/storeExtras');
  }).needs('plug/collections/storeExtras'),
  'plug/views/users/store/MiscCellView': new SimpleFetcher(function () {
    var MiscView = this.require('plug/views/users/store/MiscView');
    var cellInst = MiscView.prototype.getCell(null);
    var MiscCellView = cellInst.constructor;
    cellInst.destroy();
    return MiscCellView;
  }).needs('plug/views/users/store/MiscView'),
  'plug/views/users/store/TabMenuView': function (m) {
    return isView(m) &&
      m.prototype.template === this.require('hbs!templates/user/store/TabMenu');
  },

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
  'plug/views/rooms/WalkthroughView': function () {
    return isView(m) && m.prototype.id === 'walkthrough';
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
  },

  'plug/views/welcome/LoginView': function () {
    return isView(m) && m.prototype.className.indexOf('login-mode') !== -1;
  },
  'plug/views/welcome/RegisterView': function () {
    return isView(m) && m.prototype.className.indexOf('register-mode') !== -1;
  },
  'plug/views/welcome/SignupOverlayView': function () {
    return isView(m) && m.prototype.className === 'sign-up-overlay';
  },
  'plug/views/welcome/UsernameView': function (m) {
    return isView(m) && m.prototype.className === 'username';
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



define('extplug/main',['plug-modules'],function () {

  var plugModules = require('plug-modules');

  function waitFor(cond, fn) {
    var i = setInterval(function () {
      if (cond()) {
        clearInterval(i);
        fn();
      }
    }, 20);
  }

  plugModules.run();
  plugModules.register();

  require(['extplug/ExtPlug'], function _loaded(ExtPlug) {
    waitFor(appViewExists, function () {
      var ext = new ExtPlug();
      window.extp = ext;

      ext.enable();
    });
  });

  function appViewExists() {
    try {
      var _ret = (function () {
        // the ApplicationView attaches an event handler on instantiation.
        var AppView = plugModules.require('plug/views/app/ApplicationView');
        var Events = plugModules.require('plug/core/Events');
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

  var Settings = Backbone.Model.extend({

    initialize: function initialize(attrs) {
      var opts = arguments[1] === undefined ? {} : arguments[1];

      this._meta = opts.meta;
    },

    meta: function meta() {
      return this._meta;
    }

  });

  module.exports = Settings;
});


define('extplug/store/settings',['require','exports','module','underscore','plug/store/settings','../models/Settings'],function (require, exports, module) {

  var _ = require('underscore');
  var plugSettings = require('plug/store/settings');
  var Settings = require('../models/Settings');

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

  function mayNeedProxy(url) {
    if (url.substr(0, corsproxy.length) !== corsproxy) {
      var loc = new URL(url);
      if (loc.hostname !== 'plug.dj' && loc.hostname !== 'cdn.plug.dj') {
        return true;
      }
    }
    return false;
  }
});


define('extplug/models/RoomSettings',['require','exports','module','plug/models/currentRoom','plug/util/util','../util/request','backbone','plug/core/Events'],function (require, exports, module) {

  var currentRoom = require('plug/models/currentRoom');
  var util = require('plug/util/util');
  var request = require('../util/request');
  var Backbone = require('backbone');
  var Events = require('plug/core/Events');

  var RoomSettings = Backbone.Model.extend({

    constructor: function constructor(ext) {
      Backbone.Model.call(this, {});

      this._loaded = {};

      this.load = this.load.bind(this);
      this.unload = this.unload.bind(this);
      this.reload = this.reload.bind(this);

      currentRoom.on('change:description', this.reload);

      if (currentRoom.get('joined')) {
        this.load();
      }
    },

    load: function load() {
      var _this = this;

      var unload = arguments[0] === undefined ? false : arguments[0];

      var description = currentRoom.get('description'),
          m = description.match(/(?:^|\n)@(?:p3|rcs)=(.*?)(?:\n|$)/);

      if (m) {
        var url = util.h2t(m[1]);
        request.json(url).then(function (settings) {
          if (unload) {
            _this.unload();
          } else {
            _this.clear();
          }
          _this.set(settings);
          _this.trigger('load', settings);
        }).fail(function (e) {
          _this.unload();
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
      } else if (unload) {
        this.unload();
      }
    },

    unload: function unload() {
      this.clear();
      this.trigger('unload');
    },

    reload: function reload() {
      var _this2 = this;

      // "joined" is set *after* "description"
      _.defer(function () {
        if (currentRoom.get('joined')) {
          _this2.load(true);
        }
      });
    },

    dispose: function dispose() {
      this.unload();
      currentRoom.off('change:description', this.reload);
    }

  });

  module.exports = RoomSettings;
});


define('extplug/models/PluginMeta',['require','exports','module','backbone'],function (require, exports, module) {
  var _require = require('backbone');

  var Model = _require.Model;

  var PluginMeta = Model.extend({

    defaults: {
      id: '',
      fullUrl: '',
      enabled: false,
      name: '',
      description: '',
      instance: null,
      'class': null
    },

    initialize: function initialize() {
      var _this = this;

      this.get('instance').on('enable', function () {
        _this.set('enabled', true);
      }).on('disable', function () {
        _this.set('enabled', false);
      });
    },

    enable: function enable() {
      if (!this.get('enabled')) {
        this.get('instance').enable();
      }
    },

    disable: function disable() {
      if (this.get('enabled')) {
        this.get('instance').disable();
      }
    }

  });

  module.exports = PluginMeta;
});


define('extplug/collections/PluginsCollection',['require','exports','module','backbone','../models/PluginMeta'],function (require, exports, module) {
  var _require = require('backbone');

  var Collection = _require.Collection;

  var PluginMeta = require('../models/PluginMeta');

  var PluginsCollection = Collection.extend({
    model: PluginMeta,
    comparator: function comparator(a, b) {
      return a.get('name') > b.get('name') ? 1 : a.get('name') < b.get('name') ? -1 : 0;
    }
  });

  module.exports = PluginsCollection;
});
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define('sistyl',[],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.sistyl = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['exports', 'module', 'split-selector'], factory);
  } else if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
    factory(exports, module, require('split-selector'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, mod, global.splitSelector);
    global.sistyl = mod.exports;
  }
})(this, function (exports, module, _splitSelector) {
  'use strict';

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  module.exports = sistyl;

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  var _splitSelector2 = _interopRequireDefault(_splitSelector);

  function sistyl(defaults) {
    return new sistyl.Sistyl(defaults);
  }

  sistyl.Sistyl = (function () {

    // sistyl constructor, takes an optional default set of rulesets

    function Sistyl() {
      var defaults = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      _classCallCheck(this, Sistyl);

      this._rules = {};

      if (defaults) this.set(defaults);
    }

    // concats and regroups selectors. Deals with nested groups like
    //
    //   expand('#a, #b', '.x, .y')
    //
    // returns:
    //
    //   '#a .x, #a .y, #b .x, #b .y'

    _createClass(Sistyl, [{
      key: '_expand',
      value: function _expand(base, sub) {
        var children = (0, _splitSelector2['default'])(sub);
        return (0, _splitSelector2['default'])(base).reduce(function (selectors, parent) {
          return selectors.concat(children.map(function (child) {
            return parent + ' ' + child;
          }));
        }, []).join(', ');
      }

      // .set() takes a selector name and an object of properties
      // and nested rulesets (passing an object as a property value)
      // Alternatively, it takes an object of rulesets, the keys
      // being selectors and the values being rulesets (incl. nested)
      //
      //   style.set('.selector', { 'css-prop': 'value' })
      //   style.set('.selector', {
      //     '.nested': { 'prop': 'value' },
      //     'sibling-prop': 'sibling'
      //   })
      //   style.set({
      //     '.selector-1': { 'css-prop': 'one' },
      //     '.selector-2': { 'css-prop': 'two' }
      //   })
    }, {
      key: 'set',
      value: function set(sel, props) {
        var _this = this;

        var rules = this._rules;
        if (props) {
          if (props instanceof Sistyl) props = props.rulesets();
          Object.keys(props).forEach(function (prop) {
            var val = props[prop];
            if (typeof val === 'object') {
              // nested rules
              _this.set(_this._expand(sel, prop), val);
            } else {
              if (!(sel in _this._rules)) {
                _this._rules[sel] = {};
              }
              _this._rules[sel][prop] = val;
            }
          });
        } else {
          if (sel instanceof Sistyl) sel = sel.rulesets();
          Object.keys(sel).forEach(function (selector) {
            _this.set(selector, sel[selector]);
          });
        }

        return this;
      }

      // .unset() removes a ruleset from the sistyl instance, that
      // corresponds to the given selector.
      // Note that it removes *just* the given selector, and not
      // other rulesets that also match the selector. Specifically,
      // .unset('.rem') does *not* remove a '.keep, .rem' selector.
      //
      // style.unset('.selector') // removes the `.selector {}`
      //                          // ruleset
      // style.unset('.selector', // removes the `color` property
      //             'color')     // from the `.selector` ruleset.
    }, {
      key: 'unset',
      value: function unset(selector, prop) {
        if (prop !== undefined) {
          delete this._rules[selector][prop];
        } else {
          delete this._rules[selector];
        }
        return this;
      }

      // returns the flattened rulesets on this sistyl object
      // i.e. after
      //
      //   style.set({ '.parent': { '.child': {} } })
      //
      // `style.rulesets()` will return
      //
      //   { '.parent .child': {} }
      //
    }, {
      key: 'rulesets',
      value: function rulesets() {
        return this._rules;
      }

      // formats the current rulesets as a valid CSS string
      // (unless you set invalid property values, but then
      // you're to blame!)
    }, {
      key: 'toString',
      value: function toString() {
        var str = '';
        var rules = this._rules;
        Object.keys(rules).forEach(function (selector) {
          var ruleset = rules[selector];
          str += selector + ' {\n';
          Object.keys(ruleset).forEach(function (property) {
            str += '  ' + property + ': ' + ruleset[property] + ';\n';
          });
          str += '}\n\n';
        });
        return str;
      }
    }]);

    return Sistyl;
  })();
});
},{"split-selector":2}],2:[function(require,module,exports){
// attr regex, from Sizzle via css-what:
// https://github.com/fb55/css-what/blob/3083ac06/index.js#L8
// https://github.com/jquery/sizzle/blob/a7020477/src/sizzle.js#L84
var attr = /^\s*((?:\\.|[\w\u00c0-\uFFFF\-])+)\s*(?:(\S?)=\s*(?:(['"])(.*?)\3|(#?(?:\\.|[\w\u00c0-\uFFFF\-])*)|)|)\s*(i)?\]/
// all the non-attr things
var normalBits = /^([^\[\],]+)/

module.exports = function splitSelector(selector) {
  var i = 0
  var chunk = selector
  var parts = []
  var current = ''
  var match

  while (chunk = chunk.slice(i)) {
    if (match = normalBits.exec(chunk)) {
      i = match[0].length
      current += match[0]
    }
    else if (chunk[0] === ',') {
      parts.push(current.trim())
      current = ''
      i = 1
    }
    else if (chunk[0] === '[') {
      match = attr.exec(chunk.slice(1))
      if (match) {
        current += '[' + match[0]
        i = 1 + match[0].length
      }
    }
    else {
      throw new Error('Could not parse: ' + chunk)
    }
  }

  if (current) parts.push(current.trim())

  return parts
}
},{}]},{},[1])(1)
});


define('extplug/util/Style',['require','exports','module','jquery','underscore','sistyl','plug/core/Class','plug/views/rooms/popout/PopoutView'],function (require, exports, module) {

  var $ = require('jquery');
  var _ = require('underscore');

  var _require = require('sistyl');

  var Sistyl = _require.Sistyl;

  var Class = require('plug/core/Class');
  var popoutView = require('plug/views/rooms/popout/PopoutView');

  // hack to get plug.dj-like Class inheritance on a not-plug.dj-like Class
  var Style = Class.extend.call(Sistyl, {
    init: function init(defaults) {
      Sistyl.call(this, defaults);
      this._timeout = null;

      this.refresh = this.refresh.bind(this);
      this.id = _.uniqueId('eps-');

      this.el = $('<style />').addClass('extplug-style').attr('id', this.id).attr('type', 'text/css').appendTo('head');
      if (popoutView._window) {
        this.el.clone().appendTo(popoutView.$document.find('head'));
      }
      this.refresh();
    },

    $: function $() {
      var el = this.el;
      if (popoutView._window) {
        el = el.add(popoutView.$document.find('#' + this.id));
      }
      return el;
    },

    set: function set(sel, props) {
      this._super(sel, props);

      // throttle updates
      clearTimeout(this._timeout);
      this._timeout = setTimeout(this.refresh, 1);
      return this;
    },

    refresh: function refresh() {
      this.$().text(this.toString());
    },

    remove: function remove() {
      this.$().remove();
    }

  });

  module.exports = Style;
});


define('extplug/views/users/settings/ControlGroupView',['require','exports','module','jquery','backbone'],function (require, exports, module) {

  var $ = require('jquery');

  var _require = require('backbone');

  var View = _require.View;

  var ControlGroupView = View.extend({
    className: 'extplug control-group',

    initialize: function initialize() {
      this.controls = [];
    },

    render: function render() {
      var _this = this;

      var switchAt = Math.ceil(this.controls.length / 2 - 1);
      var current = $('<div />').addClass('left').appendTo(this.$el);
      this.controls.forEach(function (item, i) {
        current.append(item.$el);
        item.render();
        if (i === switchAt) {
          current = $('<div />').addClass('right').appendTo(_this.$el);
        }
      });
      return this;
    },

    addControl: function addControl(control) {
      this.controls.push(control);
      return this;
    }
  });

  module.exports = ControlGroupView;
});


define('extplug/views/users/settings/CheckboxView',['require','exports','module','backbone','jquery','plug/core/Events'],function (require, exports, module) {

  var Backbone = require('backbone');
  var $ = require('jquery');
  var Events = require('plug/core/Events');

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
        this.trigger('change', this.enabled);
      }
    }
  });

  module.exports = CheckboxView;
});


define('extplug/views/users/settings/DropdownView',['require','exports','module','backbone','jquery','underscore'],function (require, exports, module) {

  var Backbone = require('backbone');
  var $ = require('jquery');
  var _ = require('underscore');

  var DropdownView = Backbone.View.extend({
    className: 'dropdown',
    tagName: 'dl',
    initialize: function initialize() {
      if (!this.options.selected) {
        this.options.selected = Object.keys(this.options.options)[0];
      }

      this.onDocumentClick = this.onDocumentClick.bind(this);
      this.onBaseClick = this.onBaseClick.bind(this);
      this.onRowClick = this.onRowClick.bind(this);
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
      var _this = this;

      if (this.$el.hasClass('open')) {
        this.close();
      } else {
        this.$el.addClass('open');
        _.defer(function () {
          $(document).on('click', _this.onDocumentClick);
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
    }
  });

  module.exports = DropdownView;
});


define('extplug/views/users/settings/SliderView',['require','exports','module','backbone','jquery'],function (require, exports, module) {
  var Backbone = require('backbone');
  var $ = require('jquery');

  function template(o) {
    return '\n      <span class="title">' + o.label + '</span>\n      <span class="value"></span>\n      <div class="counts">\n        <span class="count">' + o.min + '</span>\n        <span class="count">' + o.max + '</span>\n        <span class="stretch"></span>\n      </div>\n      <div class="slider">\n        <div class="bar"></div>\n        <div class="circle"></div>\n        <div class="hit"></div>\n      </div>\n    ';
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

  module.exports = SliderView;
});


define('extplug/views/users/settings/DefaultSettingsView',['require','exports','module','./ControlGroupView','./CheckboxView','./DropdownView','./SliderView','underscore'],function (require, exports, module) {

  var ControlGroupView = require('./ControlGroupView');
  var CheckboxView = require('./CheckboxView');
  var DropdownView = require('./DropdownView');
  var SliderView = require('./SliderView');

  var _require = require('underscore');

  var each = _require.each;
  var has = _require.has;

  var controlFactory = {
    boolean: function boolean(setting, value) {
      return new CheckboxView({
        label: setting.label,
        enabled: value
      });
    },
    dropdown: function dropdown(setting, value) {
      return new DropdownView({
        label: setting.label,
        options: setting.options,
        selected: value
      });
    },
    slider: function slider(setting, value) {
      return new SliderView({
        label: setting.label,
        min: setting.min,
        max: setting.max,
        value: settings.get(name)
      });
    }
  };

  var DefaultSettingsView = ControlGroupView.extend({

    render: function render() {
      var _this = this;

      this.controls = [];

      var meta = this.model.meta();
      var settings = this.model;
      each(meta, function (setting, name) {
        if (has(controlFactory, setting.type)) {
          var control = controlFactory[setting.type](setting, settings.get(name));
          control.on('change', function (value) {
            return settings.set(name, value);
          });
          _this.addControl(control);
        }
      });

      this._super();

      return this;
    },

    remove: function remove() {
      this.controls.forEach(function (control) {
        return control.destroy();
      });
      this.controls = [];
    }

  });

  module.exports = DefaultSettingsView;
});
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define('debug',[],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.debug = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = require('./debug');
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = 'undefined' != typeof chrome
               && 'undefined' != typeof chrome.storage
                  ? chrome.storage.local
                  : localstorage();

/**
 * Colors.
 */

exports.colors = [
  'lightseagreen',
  'forestgreen',
  'goldenrod',
  'dodgerblue',
  'darkorchid',
  'crimson'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // is webkit? http://stackoverflow.com/a/16459606/376773
  return ('WebkitAppearance' in document.documentElement.style) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (window.console && (console.firebug || (console.exception && console.table))) ||
    // is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    (navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31);
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  return JSON.stringify(v);
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs() {
  var args = arguments;
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? ' %c' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return args;

  var c = 'color: ' + this.color;
  args = [args[0], c, 'color: inherit'].concat(Array.prototype.slice.call(args, 1));

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-z%]/g, function(match) {
    if ('%%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
  return args;
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // this hackery is required for IE8/9, where
  // the `console.log` function doesn't have 'apply'
  return 'object' === typeof console
    && console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      exports.storage.removeItem('debug');
    } else {
      exports.storage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  var r;
  try {
    r = exports.storage.debug;
  } catch(e) {}
  return r;
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage(){
  try {
    return window.localStorage;
  } catch (e) {}
}

},{"./debug":2}],2:[function(require,module,exports){

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = debug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = require('ms');

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lowercased letter, i.e. "n".
 */

exports.formatters = {};

/**
 * Previously assigned color.
 */

var prevColor = 0;

/**
 * Previous log timestamp.
 */

var prevTime;

/**
 * Select a color.
 *
 * @return {Number}
 * @api private
 */

function selectColor() {
  return exports.colors[prevColor++ % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function debug(namespace) {

  // define the `disabled` version
  function disabled() {
  }
  disabled.enabled = false;

  // define the `enabled` version
  function enabled() {

    var self = enabled;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // add the `color` if not set
    if (null == self.useColors) self.useColors = exports.useColors();
    if (null == self.color && self.useColors) self.color = selectColor();

    var args = Array.prototype.slice.call(arguments);

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %o
      args = ['%o'].concat(args);
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    if ('function' === typeof exports.formatArgs) {
      args = exports.formatArgs.apply(self, args);
    }
    var logFn = enabled.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }
  enabled.enabled = true;

  var fn = exports.enabled(namespace) ? enabled : disabled;

  fn.namespace = namespace;

  return fn;
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  var split = (namespaces || '').split(/[\s,]+/);
  var len = split.length;

  for (var i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

},{"ms":3}],3:[function(require,module,exports){
/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} options
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options){
  options = options || {};
  if ('string' == typeof val) return parse(val);
  return options.long
    ? long(val)
    : short(val);
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = '' + str;
  if (str.length > 10000) return;
  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(str);
  if (!match) return;
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function short(ms) {
  if (ms >= d) return Math.round(ms / d) + 'd';
  if (ms >= h) return Math.round(ms / h) + 'h';
  if (ms >= m) return Math.round(ms / m) + 'm';
  if (ms >= s) return Math.round(ms / s) + 's';
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function long(ms) {
  return plural(ms, d, 'day')
    || plural(ms, h, 'hour')
    || plural(ms, m, 'minute')
    || plural(ms, s, 'second')
    || ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) return;
  if (ms < n * 1.5) return Math.floor(ms / n) + ' ' + name;
  return Math.ceil(ms / n) + ' ' + name + 's';
}

},{}]},{},[1])(1)
});
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define('regexp-quote',[],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.regexpQuote = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = function (string) {
  return string.replace(/[-\\^$*+?.()|[\]{}]/g, "\\$&")
}

},{}]},{},[1])(1)
});


define('extplug/Plugin',['require','exports','module','jquery','underscore','backbone','plug/core/Class','./models/Settings','./util/Style','./views/users/settings/DefaultSettingsView','debug','regexp-quote'],function (require, exports, module) {

  var jQuery = require('jquery');
  var _ = require('underscore');
  var Backbone = require('backbone');
  var Class = require('plug/core/Class');
  var Settings = require('./models/Settings');
  var Style = require('./util/Style');
  var SettingsView = require('./views/users/settings/DefaultSettingsView');
  var debug = require('debug');
  var quote = require('regexp-quote');

  var stubHook = function stubHook() {};

  var Plugin = Class.extend({
    init: function init(id, ext) {
      var _this = this;

      _.extend(this, Backbone.Events);

      this.id = id;
      this.ext = ext;

      this.debug = debug('extplug:plugin:' + id);

      var settings = new Settings({}, { meta: this.settings });
      if (this.settings) {
        _.each(this.settings, function (setting, name) {
          settings.set(name, setting['default']);
        });
        this._settings = this.settings;
      }
      this.settings = settings;

      this.refresh = this.refresh.bind(this);
      this.$ = this.$.bind(this);

      // dis/enable hooks used to require _super() calls which were easy to
      // forget. now, we attach events if the methods have been defined.
      // it's all a bit ugly but...
      if (this.enable !== stubHook) {
        this.on('enable', this.enable, this);
      }
      if (this.disable !== stubHook) {
        this.on('disable', this.disable, this);
      }

      // prevent overwriting dis/enable hooks later
      // use the events if you need to do additional work
      Object.defineProperties(this, {
        enable: {
          value: function value() {
            _this.trigger('enable');
            Plugin.trigger('enable', _this);
          }
        },
        disable: {
          value: function value() {
            _this.trigger('disable');
            Plugin.trigger('disable', _this);
          }
        }
      });

      // Styles API
      this._styles = [];
      if (this.style) {
        // declarative `style: {}` API
        this.on('enable', function () {
          _this.createStyle(_this.style);
        });
      }
      this.on('disable', function () {
        _this.removeStyles();
      });

      // Chat Commands API
      this._commands = [];
      if (this.commands) {
        // declarative `commands: {}` API
        this.on('enable', function () {
          _.each(_this.commands, function (method, name) {
            _this.addCommand(name, _this[method].bind(_this));
          });
        });
      }
      this.on('disable', function () {
        _this.removeCommands();
      });
    },

    $: function $(sel) {
      this.debug('Plugin#$ is deprecated. Use require(\'jquery\') instead.');
      return jQuery(sel || document);
    },

    // obsolete, but some plugins call _super()
    disable: stubHook,
    enable: stubHook,

    refresh: function refresh() {
      this.disable();
      this.enable();
    },

    // Styles API
    createStyle: function createStyle() {
      var defaults = arguments[0] === undefined ? {} : arguments[0];

      var style = new Style(defaults);
      this._styles.push(style);
      return style;
    },
    Style: function Style(defaults) {
      this.debug('Plugin#Style is deprecated. Use Plugin#createStyle instead.');
      return this.createStyle(defaults);
    },
    removeStyles: function removeStyles() {
      if (this._styles) {
        this._styles.forEach(function (style) {
          return style.remove();
        });
      }
      this._styles = [];
    },

    // Chat Commands API
    addCommand: function addCommand(name, cb) {
      var rx = new RegExp('^/' + quote(name) + '\\b');
      var fn = function fn(text) {
        if (rx.test(text)) {
          cb(text.slice(name.length + 2));
        }
      };
      this._commands.push(fn);
      API.on(API.CHAT_COMMAND, fn);
    },
    removeCommands: function removeCommands() {
      this._commands.forEach(_.partial(API.off, API.CHAT_COMMAND), API);
      this._commands = [];
    },

    // Settings API
    getSettingsView: function getSettingsView() {
      return new SettingsView({ model: this.settings });
    }

  });

  _.extend(Plugin, Backbone.Events);

  module.exports = Plugin;
});


var _defineProperty = function (obj, key, value) { return Object.defineProperty(obj, key, { value: value, enumerable: key == null || typeof Symbol == 'undefined' || key.constructor !== Symbol, configurable: true, writable: true }); };

define('extplug/pluginLoader',['require','exports','module','./util/request','./models/PluginMeta'],function (require, exports, module) {

  var request = require('./util/request');
  var PluginMeta = require('./models/PluginMeta');

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

  exports.load = function (url, cb) {
    var o = parse(url);
    if (o.name) {
      // add module name alias to the plugin URL
      // this way, when we require([ module name ]), the plugin URL
      // will be loaded instead.
      // then, the plugin URL will define() the module name anyway,
      // and requirejs will figure everything out.
      // Chopping off the .js extension because require.js adds it
      // since we're actually requiring a module name and not a path.
      requirejs({ paths: _defineProperty({}, o.name, o.url.replace(/\.js$/, '')) });
    }
    var pluginId = o.name || o.url;
    var onLoad = function onLoad(Plugin) {
      var instance = new Plugin(pluginId, window.extp);
      var meta = new PluginMeta({
        id: pluginId,
        fullUrl: url,
        name: instance.name,
        description: instance.description,
        instance: instance,
        'class': Plugin
      });
      cb(null, meta);
    };
    requirejs([pluginId], onLoad, cb);
  };
});
define('extplug/package',{
  "name": "extplug",
  "version": "0.13.4",
  "description": "Highly flexible, modular userscript extension for plug.dj.",
  "dependencies": {
    "debug": "^2.2.0",
    "es6-symbol": "^2.0.1",
    "meld": "1.x",
    "plug-modules": "^4.2.2",
    "regexp-quote": "0.0.0",
    "semver-compare": "^1.0.0",
    "sistyl": "^1.0.0"
  },
  "devDependencies": {
    "browserify": "^10.2.4",
    "del": "^1.2.0",
    "gulp": "^3.8.11",
    "gulp-babel": "^5.1.0",
    "gulp-concat": "^2.5.2",
    "gulp-data": "^1.2.0",
    "gulp-rename": "^1.2.2",
    "gulp-template": "^3.0.0",
    "jscs": "^1.13.1",
    "mkdirp": "^0.5.1",
    "requirejs": "^2.1.17",
    "run-sequence": "^1.1.0",
    "vinyl-source-stream": "^1.1.0"
  },
  "scripts": {
    "build": "gulp build",
    "test": "jscs src"
  },
  "builtAt": 1438082585195
});


define('extplug/plugins/version',['require','exports','module','../Plugin','../package'],function (require, exports, module) {
  var Plugin = require('../Plugin');
  var _package = require('../package');

  var pad = function pad(x) {
    return x < 10 ? '0' + x : x;
  };

  var ba = new Date(_package.builtAt);
  var builtAt = ba.getUTCFullYear() + '-' + pad(ba.getUTCMonth() + 1) + '-' + pad(ba.getUTCDate() + 1) + ' ' + pad(ba.getUTCHours() + 1) + ':' + pad(ba.getUTCMinutes() + 1) + ':' + pad(ba.getUTCSeconds() + 1) + ' UTC';

  var VersionPlugin = Plugin.extend({
    commands: {
      version: 'showVersion'
    },

    showVersion: function showVersion() {
      API.chatLog('' + _package.name + ' v' + _package.version + ' (' + builtAt + ')');
    }
  });

  module.exports = VersionPlugin;
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



define('extplug/views/users/settings/TabMenuView',['require','exports','module','plug/views/users/settings/TabMenuView','jquery'],function (require, exports, module) {

  var SettingsTabMenuView = require('plug/views/users/settings/TabMenuView');
  var $ = require('jquery');

  var TabMenuView = SettingsTabMenuView.extend({

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
        this.select('ext-plug');
      }
    }

  });

  module.exports = TabMenuView;
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
        title: 'Remove Plugin',
        message: 'Are you sure you want to uninstall this plugin?',
        action: function action() {
          extp.uninstall(_this.model.get('id'));
        }
      })));
    }
  });

  module.exports = RemoveBoxView;
});


define('extplug/views/dialogs/InstallPluginDialog',['require','exports','module','jquery','plug/views/dialogs/Dialog','plug/core/Events','plug/events/AlertEvent','plug/views/spinner/SpinnerView'],function (require, exports, module) {

  var $ = require('jquery');
  var Dialog = require('plug/views/dialogs/Dialog');
  var Events = require('plug/core/Events');
  var AlertEvent = require('plug/events/AlertEvent');
  var SpinnerView = require('plug/views/spinner/SpinnerView');

  var InstallPluginDialog = Dialog.extend({
    id: 'dialog-install-plugin',
    className: 'dialog',
    render: function render() {
      // don't overlay chat
      $('#dialog-container').addClass('is-preview');
      this.$input = $('<input />').attr({
        type: 'text',
        placeholder: 'https://'
      });
      this.$wrap = $('<div />').addClass('dialog-input-background').append(this.$input);
      this.$el.append(this.getHeader('Install Plugin')).append(this.getBody().append(this.getMessage('Enter the URL of the plugin you wish to install:')).append(this.$wrap)).append(this.getButtons('Install', true));
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
            Events.dispatch(new AlertEvent(AlertEvent.ALERT, 'Install Plugin Error', 'Error: ' + err.message, function () {}));
          } else {
            Events.dispatch(new AlertEvent(AlertEvent.ALERT, 'Install Plugin', 'Plugin installed successfully.', function () {}));
          }
        });
      }
    },
    close: function close() {
      $('#dialog-container').removeClass('is-preview');
      this.$input.off();
      this._super();
    }
  });

  module.exports = InstallPluginDialog;
});


define('extplug/views/users/settings/footers/GroupFooterView',['require','exports','module','backbone'],function (require, exports, module) {
  var _require = require('backbone');

  var View = _require.View;

  var GroupFooterView = View.extend({
    className: 'extplug-group-footer',

    render: function render() {
      this.$left = $('<div />').addClass('left');
      this.$right = $('<div />').addClass('right');
      this.$el.append(this.$left, this.$right);

      return this._super();
    }
  });

  module.exports = GroupFooterView;
});


define('extplug/views/users/settings/footers/PluginsFooterView',['require','exports','module','plug/core/Events','plug/events/ShowDialogEvent','../../../dialogs/InstallPluginDialog','./GroupFooterView'],function (require, exports, module) {

  var Events = require('plug/core/Events');
  var ShowDialogEvent = require('plug/events/ShowDialogEvent');
  var InstallPluginDialog = require('../../../dialogs/InstallPluginDialog');
  var GroupFooterView = require('./GroupFooterView');

  var PluginsFooterView = GroupFooterView.extend({
    render: function render() {
      var _this = this;

      this._super();
      this.$install = $('<button />').text('Install Plugin');
      this.$manage = $('<button />').text('Manage');

      this.$install.on('click', function () {
        Events.dispatch(new ShowDialogEvent(ShowDialogEvent.SHOW, new InstallPluginDialog()));
      });
      this.$manage.on('click', function () {
        return _this.trigger('manage');
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

  module.exports = PluginsFooterView;
});


define('extplug/views/users/settings/footers/ManagingFooterView',['require','exports','module','./GroupFooterView'],function (require, exports, module) {

  var GroupFooterView = require('./GroupFooterView');

  var ManagingFooterView = GroupFooterView.extend({
    render: function render() {
      var _this = this;

      this._super();
      this.$done = $('<button />').text('Done').on('click', function () {
        return _this.trigger('unmanage');
      });
      this.$right.append(this.$done);
      return this;
    },

    remove: function remove() {
      this.$done.off();
    }
  });

  module.exports = ManagingFooterView;
});


define('extplug/views/users/settings/PluginsGroupView',['require','exports','module','./CheckboxView','./RemoveBoxView','./footers/PluginsFooterView','./footers/ManagingFooterView','./ControlGroupView'],function (require, exports, module) {

  var CheckboxView = require('./CheckboxView');
  var RemoveBoxView = require('./RemoveBoxView');
  var PluginsFooterView = require('./footers/PluginsFooterView');
  var ManagingFooterView = require('./footers/ManagingFooterView');
  var ControlGroupView = require('./ControlGroupView');

  var PluginsGroupView = ControlGroupView.extend({

    initialize: function initialize() {
      this.collection.on('reset add remove', this.onUpdate, this);
      this.onUpdate();
    },

    render: function render() {
      this.$el.empty();

      this._super();
      this.renderFooter();

      return this;
    },

    renderFooter: function renderFooter() {
      if (this.footer) {
        this.footer.destroy();
      }
      this.footer = this.managing ? new ManagingFooterView() : new PluginsFooterView();
      this.footer.on('unmanage', this.unmanage, this);
      this.footer.on('manage', this.manage, this);
      this.footer.render();
      this.$el.append(this.footer.$el);
    },

    onUpdate: function onUpdate() {
      var _this = this;

      this.controls = this.collection.toArray().map(function (plugin) {
        var box = null;
        if (_this.managing) {
          box = new RemoveBoxView({ model: plugin });
        } else {
          box = new CheckboxView({
            label: plugin.get('name'),
            description: plugin.get('instance').description || false,
            enabled: plugin.get('enabled')
          });
        }
        box.on('change', function (enabled) {
          if (enabled) {
            plugin.get('instance').enable();
          } else {
            plugin.get('instance').disable();
          }
        });
        return box;
      });
    },

    manage: function manage() {
      this.managing = true;
      this.onUpdate();
      this.render();
    },
    unmanage: function unmanage() {
      this.managing = false;
      this.onUpdate();
      this.render();
    }

  });

  module.exports = PluginsGroupView;
});


define('extplug/views/users/settings/SettingsView',['require','exports','module','backbone','./ControlGroupView','./PluginsGroupView','./CheckboxView','./RemoveBoxView','../../../models/PluginMeta','plug/core/Events','plug/util/window','underscore','jquery'],function (require, exports, module) {
  var _require = require('backbone');

  var View = _require.View;

  var ControlGroupView = require('./ControlGroupView');
  var PluginsGroupView = require('./PluginsGroupView');
  var CheckboxView = require('./CheckboxView');
  var RemoveBoxView = require('./RemoveBoxView');
  var PluginMeta = require('../../../models/PluginMeta');
  var Events = require('plug/core/Events');
  var window = require('plug/util/window');

  var _require2 = require('underscore');

  var defer = _require2.defer;

  var $ = require('jquery');

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

  var SettingsView = View.extend({
    className: 'ext-plug section',

    initialize: function initialize(o) {
      this.plugins = o.plugins;
      this.ext = o.ext;

      this.refresh();

      this.plugins.on('change:enabled', this.onEnabledChange, this).on('reset add remove', this.onUpdate, this);
    },

    remove: function remove() {
      this.plugins.on('change:enabled', this.onEnabledChange).off('reset add remove', this.onUpdate);
    },

    onUpdate: function onUpdate() {
      this.refresh();
      this.render();
    },

    onEnabledChange: function onEnabledChange() {
      // TODO only add/remove changed groups
      this.onUpdate();
    },

    refresh: function refresh() {
      this.groups = [];
      this.addGroup('Plugins', this.createPluginsGroup(), 1000);
      this.addGroup('ExtPlug', this.createExtPlugGroup(), 999);
      this.plugins.forEach(function (plugin) {
        // add plugin settings group for stuff that was already enabled
        if (plugin.get('enabled')) {
          var pluginSettings = this.createSettingsGroup(plugin);
          if (pluginSettings) {
            this.addGroup(plugin.get('name'), pluginSettings);
          }
        }
      }, this);
    },

    render: function render() {
      var _this = this;

      if (this.scrollPane) {
        this.scrollPane.destroy();
        defer(function () {
          var size = window.getSize();
          _this.onResize(size.width, size.height);
        });
      }
      this.$container = $('<div>').addClass('container');
      this.$el.empty().append(this.$container);

      this.sort();
      this.groups.forEach(function (group) {
        var header = $('<div />').addClass('header').append($('<span>').text(group.name));
        group.view.render();
        this.$container.append(header).append(group.view.$el);
      }, this);

      this.$container.jScrollPane();
      this.scrollPane = this.$container.data('jsp');

      return this;
    },

    createPluginsGroup: function createPluginsGroup() {
      var pluginsGroup = new PluginsGroupView({
        collection: this.plugins
      });
      return pluginsGroup;
    },
    createExtPlugGroup: function createExtPlugGroup() {
      return this.ext.getSettingsView();
    },

    createSettingsGroup: function createSettingsGroup(pluginMeta) {
      var plugin = pluginMeta.get('instance');
      if (!plugin._settings) {
        return;
      }

      return plugin.getSettingsView();
    },

    sort: function sort() {
      this.groups.sort(function (a, b) {
        var c = b.priority - a.priority;
        if (c === 0) {
          c = a.name > b.name ? 1 : a.name < b.name ? -1 : 0;
        }
        return c;
      });
    },

    onResize: function onResize(w, h) {
      this.$container.height(h - this.$container.offset().top);
      if (this.scrollPane) {
        this.scrollPane.reinitialise();
      }
    },

    addGroup: function addGroup(name, view, priority) {
      this.groups.push({
        name: name,
        view: view,
        priority: typeof priority === 'number' ? priority : 0
      });
    },

    getGroup: function getGroup(name) {
      for (var i = 0, l = this.groups.length; i < l; i++) {
        if (this.groups[i].name === name) {
          return this.groups[i].view;
        }
      }
    },

    hasGroup: function hasGroup(name) {
      return this.groups.some(function (group) {
        return group.name === name;
      });
    },

    removeGroup: function removeGroup(name) {
      for (var i = 0, l = this.groups.length; i < l; i++) {
        if (this.groups[i].name === name) {
          return this.groups.splice(i, 1);
        }
      }
    }

  });

  module.exports = SettingsView;
});


define('extplug/plugins/settings-tab',['require','exports','module','meld','plug/core/Events','plug/views/users/UserView','plug/views/users/settings/SettingsView','../Plugin','../views/users/settings/TabMenuView','../views/users/settings/SettingsView'],function (require, exports, module) {
  var _require = require('meld');

  var around = _require.around;
  var after = _require.after;

  var Events = require('plug/core/Events');
  var UserView = require('plug/views/users/UserView');
  var UserSettingsView = require('plug/views/users/settings/SettingsView');
  var Plugin = require('../Plugin');
  var TabMenuView = require('../views/users/settings/TabMenuView');
  var SettingsSectionView = require('../views/users/settings/SettingsView');

  var SettingsTabPlugin = Plugin.extend({

    enable: function enable() {
      var _this = this;

      var userView = this.ext.appView.user;
      Events.off('show:user', userView.show);
      this._userPaneAdvice = after(UserView.prototype, 'show', function (category, sub) {
        if (category === 'settings' && sub === 'ext-plug') {
          _this.view.menu.select(sub);
        }
      });
      Events.on('show:user', userView.show, userView);

      // Add ExtPlug tab to user settings
      this._settingsTabAdvice = around(UserSettingsView.prototype, 'getMenu', function () {
        return new TabMenuView();
      });
      this._settingsPaneAdvice = around(UserSettingsView.prototype, 'getView', function (joinpoint) {
        if (joinpoint.args[0] === 'ext-plug') {
          return new SettingsSectionView({
            plugins: _this.ext._plugins,
            ext: _this.ext
          });
        }
        return joinpoint.proceed();
      });
    },

    disable: function disable() {
      this._settingsTabAdvice.remove();
      this._settingsPaneAdvice.remove();
      var userView = this.ext.appView.user;
      Events.off('show:user', userView.show);
      this._userPaneAdvice.remove();
      Events.on('show:user', userView.show, userView);
    }

  });

  module.exports = SettingsTabPlugin;
});


define('extplug/plugins/custom-chat-type',['require','exports','module','meld','plug/core/Events','plug/views/rooms/chat/ChatView','plug/util/util','plug/util/emoji','plug/store/settings','../Plugin'],function (require, exports, module) {
  var _require = require('meld');

  var around = _require.around;

  var Events = require('plug/core/Events');
  var ChatView = require('plug/views/rooms/chat/ChatView');
  var util = require('plug/util/util');
  var emoji = require('plug/util/emoji');
  var settings = require('plug/store/settings');
  var Plugin = require('../Plugin');

  /**
   * The ChatType Plugin adds a "custom" chat type. Any chat messages
   * passed through the ChatView "onReceived" handler will be affected,
   * so in particular all "chat:receive" events are handled properly.
   *
   * A chat message with "custom" in its type property can take a few
   * additional options:
   *
   *  * the "badge" property can contain an emoji name (eg ":eyes:") or
   *    an icon class (eg "icon-plugdj") as well as the standard badge
   *    names.
   *  * the "color" property takes a CSS colour, which will be used for
   *    the message text.
   *  * the "timestamp" property always defaults to the current time if
   *    it is left empty.
   *
   * This is especially useful for showing notifications in chat.
   * The "type" property can be a list of CSS class names, if it contains
   * "custom", (eg `{ type: "custom inline my-notification" }`) so you
   * can use those classes to style your message as well. Note that you
   * cannot add additional classes for the other message types.
   */
  var ChatTypePlugin = Plugin.extend({
    enable: function enable() {
      // chatView.onReceived will still be the old method after adding advice
      // so the event listener should also be swapped out
      var chatView = this.ext.appView.room.chat;
      if (chatView) {
        Events.off('chat:receive', chatView.onReceived);
      }
      this._chatTypeAdvice = around(ChatView.prototype, 'onReceived', this.onReceived);
      if (chatView) {
        Events.on('chat:receive', chatView.onReceived, chatView);
      }
    },
    disable: function disable() {
      // remove custom chat type advice, and restore
      // the original event listener
      var chatView = this.ext.appView.room.chat;
      if (chatView) {
        Events.off('chat:receive', chatView.onReceived);
      }
      this._chatTypeAdvice.remove();
      if (chatView) {
        Events.on('chat:receive', chatView.onReceived, chatView);
      }
    },

    // bound to the ChatView instance
    onReceived: function onReceived(joinpoint) {
      var message = joinpoint.args[0];
      if (message.type.split(' ').indexOf('custom') !== -1) {
        // plug.dj has some nice default styling on "update" messages
        message.type += ' update';
      }
      if (!message.timestamp) {
        message.timestamp = util.getChatTimestamp(settings.settings.chatTimestamps === 24);
      }
      // insert the chat message element
      joinpoint.proceed();

      var el = this.$chatMessages.children().last();
      if (message.classes) {
        el.addClass(message.classes);
      }
      if (message.badge) {
        // emoji badge
        if (/^:(.*?):$/.test(message.badge)) {
          var badgeBox = el.find('.badge-box');
          var emojiName = message.badge.slice(1, -1);
          if (emoji.map[emojiName]) {
            badgeBox.find('i').remove();
            badgeBox.append($('<span />').addClass('emoji-glow extplug-badji').append($('<span />').addClass('emoji emoji-' + emoji.map[emojiName])));
          }
        }
        // icon badge
        else if (/^icon-(.*?)$/.test(message.badge)) {
          var badgeBox = el.find('.badge-box');
          badgeBox.find('i').removeClass().addClass('icon').addClass(message.badge);
        }
      }
      if (message.color) {
        el.find('.msg .text').css('color', message.color);
      }
    }
  });

  module.exports = ChatTypePlugin;
});


define('extplug/plugins/chat-classes',['require','exports','module','../Plugin','plug/core/Events'],function (require, exporst, module) {

  var Plugin = require('../Plugin');
  var Events = require('plug/core/Events');

  var ChatClasses = Plugin.extend({
    name: 'Chat Classes',
    description: 'Adds some CSS classes for roles and IDs to chat messages.',

    enable: function enable() {
      Events.on('chat:beforereceive', this.onMessage, this);
    },
    disable: function disable() {
      Events.off('chat:beforereceive', this.onMessage);
    },

    onMessage: function onMessage(msg) {
      var r = API.ROLE;
      var roleClasses = ['from-user', 'from-dj', 'from-bouncer', 'from-manager', 'from-cohost', 'from-host'];

      var classes = msg.classes ? [msg.classes] : [];
      if (msg.uid) {
        classes.push('fromID-' + msg.uid);

        var user = API.getUser(msg.uid);
        if (msg.uid === API.getUser().id) {
          classes.push('from-you');
        }
        if (user) {
          if (user.gRole === r.HOST) {
            classes.push('from-admin');
          } else if (user.gRole >= r.BOUNCER) {
            classes.push('from-ambassador');
          }
          if (user.friend) {
            classes.push('from-friend');
          }
          // normal user & staff roles
          classes.push(roleClasses[user.role]);
        }
      }

      if (msg.sub) {
        classes.push('from-subscriber');
      }

      msg.classes = classes.join(' ');
    }
  });

  module.exports = ChatClasses;
});
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define('semver-compare',[],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.semvercmp = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = function cmp (a, b) {
    var pa = a.split('.');
    var pb = b.split('.');
    for (var i = 0; i < 3; i++) {
        var na = Number(pa[i]);
        var nb = Number(pb[i]);
        if (na > nb) return 1;
        if (nb > na) return -1;
        if (!isNaN(na) && isNaN(nb)) return 1;
        if (isNaN(na) && !isNaN(nb)) return -1;
    }
    return 0;
};

},{}]},{},[1])(1)
});


define('extplug/hooks/waitlist',['require','exports','module','plug/models/booth','plug/collections/waitlist','plug/collections/users','underscore'],function (require, exports, module) {

  var booth = require('plug/models/booth');
  var waitlist = require('plug/collections/waitlist');
  var users = require('plug/collections/users');

  var _require = require('underscore');

  var difference = _require.difference;
  var extend = _require.extend;

  var events = {
    WAIT_LIST_LEAVE: 'waitListLeave',
    WAIT_LIST_JOIN: 'waitListJoin'
  };

  function onChange() {
    var newList = booth.get('waitingDJs');
    var oldList = booth.previous('waitingDJs');
    var left = difference(oldList, newList);
    var entered = difference(newList, oldList);

    left.forEach(function (uid) {
      API.dispatch(API.WAIT_LIST_LEAVE, API.getUser(uid));
    });
    entered.forEach(function (uid) {
      API.dispatch(API.WAIT_LIST_JOIN, API.getUser(uid));
    });
  }

  exports.install = function () {
    booth.on('change:waitingDJs', onChange);
    extend(API, events);
  };

  exports.uninstall = function () {
    booth.off('change:waitingDJs', onChange);
    Object.keys(events).forEach(function (n) {
      delete API[n];
    });
  };
});


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

  var advice = undefined;
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

define('extplug/hooks/chat',['require','exports','module','plug/facades/chatFacade','plug/core/Events','meld'],function (require, exports, module) {

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

  var chatFacade = require('plug/facades/chatFacade');
  var Events = require('plug/core/Events');
  var meld = require('meld');

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

  var ocradvice = undefined;
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


define('extplug/hooks/settings',['require','exports','module','meld','plug/store/settings','../store/settings'],function (require, exports, module) {

  // Mirrors plug.dj settings to the ExtPlug settings model, firing
  // change events.

  var _require = require('meld');

  var before = _require.before;

  var plugSettings = require('plug/store/settings');
  var extMirror = require('../store/settings');

  var advice = undefined;

  exports.install = function () {
    advice = before(plugSettings, 'save', extMirror.update);
  };

  exports.uninstall = function () {
    advice.remove();
  };
});


define('extplug/hooks/popout-style',['require','exports','module','jquery','plug/core/Events','plug/views/rooms/popout/PopoutView'],function (require, exports, module) {

  var $ = require('jquery');
  var Events = require('plug/core/Events');
  var popoutView = require('plug/views/rooms/popout/PopoutView');

  function sync() {
    _.defer(function () {
      popoutView.$document.find('head').append($('.extplug-style').clone());
    });
  }

  exports.install = function () {
    Events.on('popout:show', sync);
  };

  exports.uninstall = function () {
    Events.off('popout:show', sync);
  };
});
// the red ExtPlug badge in the top left corner


define('extplug/styles/badge',{
  '#app-menu .button i:after': {
    // double quoted ):
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
// inline chat messages show the message contents immediately after
// the username instead of below it.


define('extplug/styles/inline-chat',{
  '#chat-messages .cm.inline': {
    'min-height': '0',

    '.badge-box': {
      // remove badge background
      margin: '5px 8px 6px',
      height: '16px',
      'border-radius': '0px',
      background: 'transparent',

      // center badge icons
      '.icon': {
        top: '50%',
        'margin-top': '-15px'
      },

      // center & resize actual user badges
      '.bdg': {
        top: '-7px',
        transform: 'scale(0.5)'
      },

      // emoji badges
      '.extplug-badji': {
        left: '7px'
      }
    },
    '.from': { display: 'inline' },
    '.text': { display: 'inline', 'margin-left': '5px' }
  },
  // remove the empty circle for badge-less users
  // (it doesn't fit in a 16px high message)
  '#chat-messages .cm .no-badge .icon': {
    width: '30px',
    height: '30px',
    top: '0px',
    left: '0px',
    border: 'none',
    'border-radius': '0px'
  }
});


define('extplug/styles/settings-pane',{
  // unlike plug.dj's own settings, ExtPlug settings are grouped
  // in separate DOM elements (separate backbone views, even)
  // plug.dj's styling doesn't quite work for this so we add some
  // manual margins around the header to make things look somewhat
  // alike.
  '.extplug.control-group:not(:first-child) .header': {
    margin: '35px 0 8px 0 !important'
  },

  // footer below grouped plugin settings
  // with a disgusting specificity hack!
  '#user-view #user-settings .extplug-group-footer': {
    clear: 'both',
    button: {
      top: 'auto',
      position: 'relative'
    }
  },

  // numeric range slider
  '.extplug-slider': {
    // plug.dj has three labels on sliders, but ExtPlug sliders
    // just have two counter labels because it's easier
    '.counts .count:nth-child(2)': {
      float: 'right'
    }
  }
});


define('extplug/styles/install-plugin-dialog',{
  '#dialog-install-plugin': {
    // magic numbers! stolen from other plug.dj dialogs
    '.dialog-body': { height: '137px' },
    '.message': { top: '21px' },
    // centered spinner
    '.spinner': { top: '50%', left: '50%' },
    // Plugin URL input, center-aligned and wide
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


define('extplug/ExtPlug',['require','exports','module','plug/core/Events','plug/views/app/ApplicationView','./store/settings','./models/RoomSettings','./models/PluginMeta','./collections/PluginsCollection','./Plugin','./pluginLoader','./plugins/version','./plugins/settings-tab','./plugins/custom-chat-type','./plugins/chat-classes','./package','jquery','underscore','backbone','meld','semver-compare','./hooks/waitlist','./hooks/api-early','./hooks/chat','./hooks/playback','./hooks/settings','./hooks/popout-style','./styles/badge','./styles/inline-chat','./styles/settings-pane','./styles/install-plugin-dialog'],function (require, exports, module) {

  var Events = require('plug/core/Events');
  var ApplicationView = require('plug/views/app/ApplicationView');

  var settings = require('./store/settings');
  var RoomSettings = require('./models/RoomSettings');
  var PluginMeta = require('./models/PluginMeta');
  var PluginsCollection = require('./collections/PluginsCollection');
  var Plugin = require('./Plugin');
  var pluginLoader = require('./pluginLoader');

  var VersionPlugin = require('./plugins/version');
  var SettingsTabPlugin = require('./plugins/settings-tab');
  var ChatTypePlugin = require('./plugins/custom-chat-type');
  var ChatClassesPlugin = require('./plugins/chat-classes');

  var _package = require('./package');

  var $ = require('jquery');
  var _ = require('underscore');
  var Backbone = require('backbone');
  var meld = require('meld');
  var semvercmp = require('semver-compare');

  var hooks = [require('./hooks/waitlist'), require('./hooks/api-early'), require('./hooks/chat'), require('./hooks/playback'), require('./hooks/settings'), require('./hooks/popout-style')];

  // LocalStorage key name for extplug
  var LS_NAME = 'extPlugins';

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
    var appView = undefined;
    if (evts) {
      appView = _.find(evts, function (event) {
        return event.ctx instanceof ApplicationView;
      });
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
  var ExtPlug = Plugin.extend({
    name: 'ExtPlug',
    settings: {
      corsProxy: { type: 'boolean', 'default': true, label: 'Use CORS proxy' }
    },
    init: function init() {
      this._super('extplug', this);

      this._core = [new VersionPlugin('version', this), new SettingsTabPlugin('settings-tab', this), new ChatTypePlugin('custom-chat-type', this), new ChatClassesPlugin('chat-classes', this)];
    },

    /**
     * Register an ExtPlug plugin by require.js module name.
     * This can be anything that is accepted by require.js, including
     * modules using require.js plugins or modules on remote URLs.
     */
    registerPlugin: function registerPlugin(id, cb) {
      var _this = this;

      pluginLoader.load(id, function (e, meta) {
        if (e) return cb && cb(e);
        _this._plugins.add(meta);
        var instance = meta.get('instance');
        var state = _this._getPluginSettings(meta.get('id'));
        instance.settings.set(state.settings);
        instance.settings.on('change', function () {
          _this._savePluginSettings(meta.get('id'));
        });
        if (state.enabled) {
          _.defer(function () {
            meta.enable();
          });
        }
        if (cb) cb(null);
      });
      return this;
    },

    /**
     * Disables and removes an ExtPlug plugin.
     */
    unregisterPlugin: function unregisterPlugin(id) {
      var plugin = this._plugins.findWhere({ id: id });
      if (plugin) {
        plugin.disable();
        this._plugins.remove(plugin);
      }
    },

    getPlugin: function getPlugin(id) {
      var meta = this._plugins.get(id);
      return meta ? meta.get('instance') : null;
    },

    /**
     * Installs a plugin. This is basically registerPlugin(), but it also
     * remembers the plugin name so it can be loaded again automatically
     * on following ExtPlug runs.
     */
    install: function install(id, cb) {
      this.registerPlugin(id, function (e) {
        if (e) return cb(e);
        var json = jsonParse(localStorage.getItem(LS_NAME));
        json.installed = (json.installed || []).concat([id]);
        localStorage.setItem(LS_NAME, JSON.stringify(json));
        cb(null);
      });
    },

    /**
     * Disables and removes a plugin forever.
     */
    uninstall: function uninstall(id) {
      this.unregisterPlugin(id);
      var json = jsonParse(localStorage.getItem(LS_NAME));
      if (json.installed) {
        var i = json.installed.indexOf(id);
        if (i !== -1) {
          json.installed.splice(i, 1);
          localStorage.setItem(LS_NAME, JSON.stringify(json));
        }
      }
    },

    /**
     * Loads installed plugins.
     */
    _loadInstalled: function _loadInstalled() {
      var _this2 = this;

      var _jsonParse = jsonParse(localStorage.getItem(LS_NAME));

      var installed = _jsonParse.installed;

      if (_.isArray(installed)) {
        (function () {
          var l = installed.length;
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
          installed.forEach(function (name) {
            _this2.registerPlugin(name, function (e) {
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
     * Checks if ExtPlug has been initialised before.
     */
    isFirstRun: function isFirstRun() {
      return localStorage.getItem(LS_NAME) == null;
    },
    /**
     * Things that should only happen the first time ExtPlug
     * is initialised.
     */
    onFirstRun: function onFirstRun() {
      localStorage.setItem(LS_NAME, JSON.stringify({
        version: _package.version,
        installed: ['autowoot/build/autowoot.js;extplug/autowoot/main', 'chat-notifications/build/chat-notifications.js;' + 'extplug/chat-notifications/main', 'compact-history/build/compact-history.js;' + 'extplug/compact-history/main', 'hide-badges/build/hide-badges.js;extplug/hide-badges/main', 'meh-icons/build/meh-icons.js;extplug/meh-icons/main', 'room-styles/build/room-styles.js;extplug/room-styles/main', 'show-deleted/build/show-deleted.js;extplug/show-deleted/main'].map(function (path) {
          return 'https://extplug.github.io/' + path;
        }),
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
    enable: function enable() {
      var _this3 = this;

      this._super();

      /**
       * Internal map of registered plugins.
       */
      this._plugins = new PluginsCollection();
      this._plugins.on('change:enabled', function (plugin, enabled) {
        _this3._savePluginSettings(plugin.get('id'));
      });

      if (this.isFirstRun()) this.onFirstRun();

      this.upgrade();

      settings.update();
      this.appView = getApplicationView();

      // install extra events
      hooks.forEach(function (hook) {
        hook.install();
      });

      this._core.forEach(function (plugin) {
        plugin.enable();
      });

      // ExtPlug styles
      this.createStyle().set(require('./styles/badge')).set(require('./styles/inline-chat')).set(require('./styles/settings-pane')).set(require('./styles/install-plugin-dialog'));

      // room settings
      this.roomSettings = new RoomSettings(this);

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
      this._plugins.off().forEach(function (mod) {
        mod.disable();
      });
      this._core.forEach(function (plugin) {
        plugin.disable();
      });
      hooks.forEach(function (hook) {
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
    _savePluginSettings: function _savePluginSettings(id) {
      var json = jsonParse(localStorage.getItem(LS_NAME));
      var plugin = this._plugins.findWhere({ id: id });
      var settings = plugin.get('instance').settings;
      if (!json.plugins) json.plugins = {};
      json.plugins[id] = { enabled: plugin.get('enabled'), settings: settings };
      localStorage.setItem(LS_NAME, JSON.stringify(json));
    },

    /**
     * Retrieves plugin settings from localStorage.
     */
    _getPluginSettings: function _getPluginSettings(id) {
      var settings = jsonParse(localStorage.getItem(LS_NAME)).plugins;
      if (settings && id in settings) {
        return settings[id];
      }
      return { enabled: false, settings: {} };
    },

    /**
     * Upgrades old ExtPlug version settings.
     */
    upgrade: function upgrade() {
      var stored = jsonParse(localStorage.getItem(LS_NAME));

      // "hide-badges" was added in 0.10.0
      if (semvercmp(stored.version, '0.10.0') < 0) {
        stored.version = '0.10.0';
        var plugin = 'extplug/plugins/hide-badges/main';
        if (stored.installed.indexOf(plugin) === -1) {
          stored.installed.push(plugin);
        }
      }

      // "rollover-blurbs" was removed from core in 0.12.0
      if (semvercmp(stored.version, '0.12.0') < 0) {
        stored.version = '0.12.0';
        replace('extplug/plugins/rollover-blurbs/main', 'https://extplug.github.io/rollover-blurb/build/rollover-blurb.js', 'extplug/rollover-blurb/main');
      }

      if (semvercmp(stored.version, '0.13.0') < 0) {
        stored.version = '0.13.0';
        replace('extplug/plugins/autowoot/main', 'https://extplug.github.io/autowoot/build/autowoot.js', 'extplug/autowoot/main');
        replace('extplug/plugins/chat-notifications/main', 'https://extplug.github.io/chat-notifications/build/chat-notifications.js', 'extplug/chat-notifications/main');
        replace('extplug/plugins/compact-history/main', 'https://extplug.github.io/compact-history/build/compact-history.js', 'extplug/compact-history/main');
        replace('extplug/plugins/hide-badges/main', 'https://extplug.github.io/hide-badges/build/hide-badges.js', 'extplug/hide-badges/main');
        replace('extplug/plugins/meh-icon/main', 'https://extplug.github.io/meh-icons/build/meh-icons.js;' + 'extplug/meh-icons/main');
        replace('extplug/plugins/room-styles/main', 'https://extplug.github.io/room-styles/build/room-styles.js', 'extplug/room-styles/main');

        // full-size video was removed in favour of plug's Video Only mode
        var fullSizeVideo = 'extplug/plugins/full-size-video/main';
        stored.installed = _.without(stored.installed, fullSizeVideo);
        delete stored.plugins[fullSizeVideo];
      }
      if (semvercmp(stored.version, '0.13.1') < 0) {
        stored.version = '0.13.1';
        // show-deleted was added to core in 0.13
        var showDeleted = 'https://extplug.github.io/show-deleted/build/show-deleted.js;' + 'extplug/show-deleted/main';
        if (stored.installed.indexOf(showDeleted) === -1) {
          stored.installed.push(showDeleted);
        }
      }

      localStorage.setItem(LS_NAME, JSON.stringify(stored));

      function replace(oldPlugin, url, name) {
        var i = stored.installed.indexOf(oldPlugin);
        if (i !== -1) {
          stored.installed.splice(i, 1, '' + url + ';' + name);
          // move settings
          stored.plugins[name] = stored.plugins[oldPlugin];
          delete stored.plugins[oldPlugin];
        }
      }
    }
  });

  module.exports = ExtPlug;
});

require(["extplug/main"]);

  }
  else {
    setTimeout(load, 20);
  }

}());
