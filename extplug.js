/**
 * ExtPlug loader. Waits for the necessary plug.dj code to load before running
 * ExtPlug.
 * This is necessary because plug.dj loads require.js lazily. Since ExtPlug uses
 * require.js modules for everything, it can't run until require.js is loaded.
 * This file waits for require.js to load, and also for plug.dj's own javascript
 * to run (i.e. for the API variable to exist) while we're at it.
 */

;(function load() {

  if (isReady()) {
    // Tampermonkey doesn't appear to find some of the global functions by
    // default, so we redefine them here as local vars.
    var requirejs = window.requirejs;
    var require = window.requirejs;
    var define = window.define;
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

var babelHelpers = {};

babelHelpers.toArray = function (arr) {
  return Array.isArray(arr) ? arr : Array.from(arr);
};

babelHelpers.toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

babelHelpers.defineProperty = function (obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
};
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
  return Model &&
    m instanceof Backbone.Collection &&
    m.model === Model;
};

// Checks if the given module is a plug.dj Dialog view class.
var isDialog = function (m) {
  return m.prototype &&
    m.prototype.className &&
    typeof m.prototype.onContainerClick === 'function';
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
  return m.prototype && 'render' in m.prototype && '$' in m.prototype;
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
  this._detectives[name] = {
    detective: detective,
    ran: false
  };
  return this;
};
// runs all known detectives.
Context.prototype.run = function () {
  if (this._ran) {
    return this;
  }

  Object.keys(this._detectives).forEach(function (name) {
    this.require(name);
  }, this);

  this._ran = true;
  return this;
};
Context.prototype.findModule = function (name) {
  var detective = this._detectives[name];
  if (detective && !detective.ran) {
    if (!detective.detective.isReady(this)) {
      detective.detective.getDependencies().forEach(function (dep) {
        this.require(dep);
      }, this);
    }
    detective.detective.run(this, name);
    detective.ran = true;
    if (this.isDefined(name)) {
      return this.require(name);
    }
  }
};
Context.prototype.resolveName = function (path) {
  return this._nameMapping[path] ? this.resolveName(this._nameMapping[path]) : path;
};
Context.prototype.require = function (path) {
  if (this.target[path]) {
    return this.target[path];
  }
  // known module
  if (this._nameMapping[path]) {
    var mod = this.require(this._nameMapping[path])
    if (mod) {
      return mod;
    }
  }
  return this.findModule(path);
};
Context.prototype.isDefined = function (path) {
  return typeof this.require(path) !== 'undefined';
};
Context.prototype.define = function (newPath, oldPath) {
  this._nameMapping[newPath] = oldPath;
  var mod = this.require(oldPath);
  if (!mod.__plugModule) {
    mod.__plugModule = newPath;
  }
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
Detective.prototype.getDependencies = function () {
  return this._needs;
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
      return this._fakeInstance.route && (
        typeof this._regex === 'string'
        ? this._fakeInstance.route.indexOf(this._regex) === 0
        : this._regex.test(this._fakeInstance.route)
      );
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
    return _.isFunction(m) && _.isFunction(m.prototype.onChannel) &&
      _.isFunction(m.prototype.loadLists);
  },
  'plug/actions/youtube/YouTubeImportService': function (m) {
    return _.isFunction(m) && _.isFunction(m.prototype.onList) &&
      _.isFunction(m.prototype.onVideos) &&
      _.isFunction(m.prototype.loadNext);
  },
  'plug/actions/youtube/YouTubeSearchService': function (m) {
    return _.isFunction(m) && _.isFunction(m.prototype.onList) &&
      _.isFunction(m.prototype.onVideos) &&
      _.isFunction(m.prototype.loadRelated);
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
    return _.isFunction(m.replace_emoticons);
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
  'plug/collections/ignores': new SimpleMatcher(function (m) {
      return isCollectionOf(m, this.require('plug/models/User')) &&
        m.comparator === 'username';
  }).needs('plug/models/User'),
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
        m.length > 0 &&
        m.last().get('id') === -1000;
    },
    cleanup: function (searchResults) {
      // we cannot get back the original search results, unfortunately,
      // without re-running the search query (which may be possible, but
      // is a little expensive)
    }
  }).needs('plug/handlers/RestrictedSearchHandler', 'plug/models/Media'),
  'plug/collections/relatedMedia': new SimpleFetcher(function (m) {
    // this collection gets reset by the relatedMediaFacade, so we can
    // overwrite the reset method on _all_ collections temporarily and
    // trigger a reset. The reset won't actually do anything else but
    // tell us which collection it was called on.
    var facade = this.require('plug/facades/relatedMediaFacade');
    var reset = Backbone.Collection.prototype.reset;
    var relatedMedia;
    Backbone.Collection.prototype.reset = function () {
      relatedMedia = this;
    };
    // fake a facade object for facade.reset's `this`, so we don't
    // reset anything that might be useful to the user
    facade.reset.call({ data: [] });
    // revert
    Backbone.Collection.prototype.reset = reset;
    return relatedMedia;
  }).needs('plug/facades/relatedMediaFacade'),
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
      // the RoomHeader looks a lot like this, but does not have its own
      // remove() method
      m.prototype.hasOwnProperty('remove') &&
      !m.prototype.hasOwnProperty('initialize');
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
  'plug/views/dialogs/StaffRoleDialog': new SimpleFetcher(function () {
    return this.require('plug/views/dialogs/UserRoleDialog');
  }).needs('plug/views/dialogs/UserRoleDialog'),
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
      !('clear' in m.prototype);
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
  'plug/views/rooms/walkthrough/GuestWalkthroughView': function (m) {
    return isView(m) && m.prototype.id === 'walkthrough' &&
      _.isFunction(m.prototype.fadeIn);
  },
  'plug/views/rooms/walkthrough/UserWalkthroughView': function (m) {
    return isView(m) && m.prototype.id === 'walkthrough' &&
      !('fadeIn' in m.prototype);
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

  'plug/views/welcome/LoginView': function (m) {
    return isView(m) && m.prototype.className.indexOf('login-mode') !== -1;
  },
  'plug/views/welcome/RegisterView': function (m) {
    return isView(m) && m.prototype.className.indexOf('register-mode') !== -1;
  },
  'plug/views/welcome/SignupOverlayView': function (m) {
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

context.load = function (name, req, cb, config) {
  var result = context.require(name);
  if (result) {
    cb(result);
  }
  else {
    cb.error(new Error('module "' + name + '" not found'));
  }
};

return context;

}));



define('extplug/main',['require','exports','module','plug-modules'],function (require, exports, module) {

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
      var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

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

      var unload = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

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
  var Style = Class.extend({
    init: function init(defaults) {
      this._sistyl = new Sistyl(defaults);
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
      this._sistyl.set(sel, props);

      // throttle updates
      clearTimeout(this._timeout);
      this._timeout = setTimeout(this.refresh, 1);
      return this;
    },

    unset: function unset(sel, prop) {
      this._sistyl.unset(sel, prop);
      return this;
    },

    rulesets: function rulesets() {
      return this._sistyl.rulesets();
    },

    refresh: function refresh() {
      this.$().text(this.toString());
    },

    remove: function remove() {
      this.$().remove();
    },

    toString: function toString() {
      return this._sistyl.toString();
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


define('extplug/views/users/settings/InputView',['require','exports','module','plug/core/Events','backbone','underscore','jquery'],function (require, exports, module) {

  var Events = require('plug/core/Events');

  var _require = require('backbone');

  var View = _require.View;

  var _require2 = require('underscore');

  var omit = _require2.omit;

  var $ = require('jquery');

  var KEY_ENTER = 13;

  var InputView = View.extend({
    className: 'item extplug-input',

    initialize: function initialize(o) {
      this.label = o.label;
      this.description = o.description;
      this.value = o.value;

      o.type = o.type || 'text';
      this.attributes = omit(o, 'label', 'value', 'description');

      this.onKeyUp = this.onKeyUp.bind(this);
      this.onKeyDown = this.onKeyDown.bind(this);
      this.onFocus = this.onFocus.bind(this);
      this.onBlur = this.onBlur.bind(this);
      this.focus = this.focus.bind(this);
    },

    render: function render() {
      var _this = this;

      this.$label = $('<label />').addClass('title').text(this.label);
      this.$input = $('<input />').attr(this.attributes).val(this.value);
      this.$wrapper = $('<div />').addClass('extplug-input-wrap');
      this.$el.append(this.$label, this.$wrapper.append(this.$input));
      if (this.description) {
        this.$label.on('mouseenter', function () {
          Events.trigger('tooltip:show', _this.description, _this.$el);
        }).on('mouseleave', function () {
          Events.trigger('tooltip:hide');
        });
      }

      this.$input.on('keyup', this.onKeyUp);
      this.$input.on('keydown', this.onKeyDown);
      this.$input.on('focus', this.onFocus);
      this.$input.on('blur', this.onBlur);

      this.$el.on('mousedown', this.focus);
    },

    onKeyUp: function onKeyUp() {},

    onKeyDown: function onKeyDown(e) {
      if (e.keyCode === KEY_ENTER) {
        this.onBlur();
      }
    },

    focus: function focus() {
      this.$input.focus();
    },

    onFocus: function onFocus() {
      this.$wrapper.addClass('focused');
    },
    onBlur: function onBlur() {
      this.$wrapper.removeClass('focused');
      this.trigger('change', this.$input.val());
    }
  });

  module.exports = InputView;
});
(function(e,t,n,r,i,s,o,u,a){function m(e){if(Object.prototype.toString.apply(e)==="[object Array]"){if(typeof e[0]=="string"&&typeof m[e[0]]=="function")return new m[e[0]](e.slice(1,e.length));if(e.length===4)return new m.RGB(e[0]/255,e[1]/255,e[2]/255,e[3]/255)}else if(typeof e=="string"){var i=e.toLowerCase();l[i]&&(e="#"+l[i]),i==="transparent"&&(e="rgba(0,0,0,0)");var s=e.match(v);if(s){var o=s[1].toUpperCase(),u=c(s[8])?s[8]:n(s[8]),a=o[0]==="H",f=s[3]?100:a?360:255,h=s[5]||a?100:255,d=s[7]||a?100:255;if(c(m[o]))throw new Error("one.color."+o+" is not installed.");return new m[o](n(s[2])/f,n(s[4])/h,n(s[6])/d,u)}e.length<6&&(e=e.replace(/^#?([0-9a-f])([0-9a-f])([0-9a-f])$/i,"$1$1$2$2$3$3"));var g=e.match(/^#?([0-9a-f][0-9a-f])([0-9a-f][0-9a-f])([0-9a-f][0-9a-f])$/i);if(g)return new m.RGB(r(g[1],16)/255,r(g[2],16)/255,r(g[3],16)/255);if(m.CMYK){var y=e.match(new t("^cmyk\\("+p.source+","+p.source+","+p.source+","+p.source+"\\)$","i"));if(y)return new m.CMYK(n(y[1])/100,n(y[2])/100,n(y[3])/100,n(y[4])/100)}}else if(typeof e=="object"&&e.isColor)return e;return!1}function g(t,n,r){function a(e,t){var n={};n[t.toLowerCase()]=new i("return this.rgb()."+t.toLowerCase()+"();"),m[t].propertyNames.forEach(function(e,r){n[e]=n[e==="black"?"k":e[0]]=new i("value","isDelta","return this."+t.toLowerCase()+"()."+e+"(value, isDelta);")});for(var r in n)n.hasOwnProperty(r)&&m[e].prototype[r]===undefined&&(m[e].prototype[r]=n[r])}m[t]=new i(n.join(","),"if (Object.prototype.toString.apply("+n[0]+") === '[object Array]') {"+n.map(function(e,t){return e+"="+n[0]+"["+t+"];"}).reverse().join("")+"}"+"if ("+n.filter(function(e){return e!=="alpha"}).map(function(e){return"isNaN("+e+")"}).join("||")+"){"+'throw new Error("['+t+']: Invalid color: ("+'+n.join('+","+')+'+")");}'+n.map(function(e){return e==="hue"?"this._hue=hue<0?hue-Math.floor(hue):hue%1":e==="alpha"?"this._alpha=(isNaN(alpha)||alpha>1)?1:(alpha<0?0:alpha);":"this._"+e+"="+e+"<0?0:("+e+">1?1:"+e+")"}).join(";")+";"),m[t].propertyNames=n;var s=m[t].prototype;["valueOf","hex","hexa","css","cssa"].forEach(function(e){s[e]=s[e]||(t==="RGB"?s.hex:new i("return this.rgb()."+e+"();"))}),s.isColor=!0,s.equals=function(r,i){c(i)&&(i=1e-10),r=r[t.toLowerCase()]();for(var s=0;s<n.length;s+=1)if(e.abs(this["_"+n[s]]-r["_"+n[s]])>i)return!1;return!0},s.toJSON=new i("return ['"+t+"', "+n.map(function(e){return"this._"+e},this).join(", ")+"];");for(var o in r)if(r.hasOwnProperty(o)){var u=o.match(/^from(.*)$/);u?m[u[1].toUpperCase()].prototype[t.toLowerCase()]=r[o]:s[o]=r[o]}s[t.toLowerCase()]=function(){return this},s.toString=new i('return "[one.color.'+t+':"+'+n.map(function(e,t){return'" '+n[t]+'="+this._'+e}).join("+")+'+"]";'),n.forEach(function(e,t){s[e]=s[e==="black"?"k":e[0]]=new i("value","isDelta","if (typeof value === 'undefined') {return this._"+e+";"+"}"+"if (isDelta) {"+"return new this.constructor("+n.map(function(t,n){return"this._"+t+(e===t?"+value":"")}).join(", ")+");"+"}"+"return new this.constructor("+n.map(function(t,n){return e===t?"value":"this._"+t}).join(", ")+");")}),f.forEach(function(e){a(t,e),a(e,t)}),f.push(t)}function y(){var e=this.rgb(),t=e._red*.3+e._green*.59+e._blue*.11;return new m.RGB(t,t,t,this._alpha)}var f=[],l={},c=function(e){return typeof e=="undefined"},h=/\s*(\.\d+|\d+(?:\.\d+)?)(%)?\s*/,p=/\s*(\.\d+|100|\d?\d(?:\.\d+)?)%\s*/,d=/\s*(\.\d+|\d+(?:\.\d+)?)\s*/,v=new t("^(rgb|hsl|hsv)a?\\("+h.source+","+h.source+","+h.source+"(?:,"+d.source+")?"+"\\)$","i");m.installMethod=function(e,t){f.forEach(function(n){m[n].prototype[e]=t})},g("RGB",["red","green","blue","alpha"],{hex:function(){var e=(o(255*this._red)*65536+o(255*this._green)*256+o(255*this._blue)).toString(16);return"#"+"00000".substr(0,6-e.length)+e},hexa:function(){var e=o(this._alpha*255).toString(16);return"#"+"00".substr(0,2-e.length)+e+this.hex().substr(1,6)},css:function(){return"rgb("+o(255*this._red)+","+o(255*this._green)+","+o(255*this._blue)+")"},cssa:function(){return"rgba("+o(255*this._red)+","+o(255*this._green)+","+o(255*this._blue)+","+this._alpha+")"}}),typeof define=="function"&&!c(define.amd)?define('onecolor',[],function(){return m}):typeof exports=="object"?module.exports=m:(one=window.one||{},one.color=m),typeof jQuery!="undefined"&&c(jQuery.color)&&(jQuery.color=m),l={aliceblue:"f0f8ff",antiquewhite:"faebd7",aqua:"0ff",aquamarine:"7fffd4",azure:"f0ffff",beige:"f5f5dc",bisque:"ffe4c4",black:"000",blanchedalmond:"ffebcd",blue:"00f",blueviolet:"8a2be2",brown:"a52a2a",burlywood:"deb887",cadetblue:"5f9ea0",chartreuse:"7fff00",chocolate:"d2691e",coral:"ff7f50",cornflowerblue:"6495ed",cornsilk:"fff8dc",crimson:"dc143c",cyan:"0ff",darkblue:"00008b",darkcyan:"008b8b",darkgoldenrod:"b8860b",darkgray:"a9a9a9",darkgrey:"a9a9a9",darkgreen:"006400",darkkhaki:"bdb76b",darkmagenta:"8b008b",darkolivegreen:"556b2f",darkorange:"ff8c00",darkorchid:"9932cc",darkred:"8b0000",darksalmon:"e9967a",darkseagreen:"8fbc8f",darkslateblue:"483d8b",darkslategray:"2f4f4f",darkslategrey:"2f4f4f",darkturquoise:"00ced1",darkviolet:"9400d3",deeppink:"ff1493",deepskyblue:"00bfff",dimgray:"696969",dimgrey:"696969",dodgerblue:"1e90ff",firebrick:"b22222",floralwhite:"fffaf0",forestgreen:"228b22",fuchsia:"f0f",gainsboro:"dcdcdc",ghostwhite:"f8f8ff",gold:"ffd700",goldenrod:"daa520",gray:"808080",grey:"808080",green:"008000",greenyellow:"adff2f",honeydew:"f0fff0",hotpink:"ff69b4",indianred:"cd5c5c",indigo:"4b0082",ivory:"fffff0",khaki:"f0e68c",lavender:"e6e6fa",lavenderblush:"fff0f5",lawngreen:"7cfc00",lemonchiffon:"fffacd",lightblue:"add8e6",lightcoral:"f08080",lightcyan:"e0ffff",lightgoldenrodyellow:"fafad2",lightgray:"d3d3d3",lightgrey:"d3d3d3",lightgreen:"90ee90",lightpink:"ffb6c1",lightsalmon:"ffa07a",lightseagreen:"20b2aa",lightskyblue:"87cefa",lightslategray:"789",lightslategrey:"789",lightsteelblue:"b0c4de",lightyellow:"ffffe0",lime:"0f0",limegreen:"32cd32",linen:"faf0e6",magenta:"f0f",maroon:"800000",mediumaquamarine:"66cdaa",mediumblue:"0000cd",mediumorchid:"ba55d3",mediumpurple:"9370d8",mediumseagreen:"3cb371",mediumslateblue:"7b68ee",mediumspringgreen:"00fa9a",mediumturquoise:"48d1cc",mediumvioletred:"c71585",midnightblue:"191970",mintcream:"f5fffa",mistyrose:"ffe4e1",moccasin:"ffe4b5",navajowhite:"ffdead",navy:"000080",oldlace:"fdf5e6",olive:"808000",olivedrab:"6b8e23",orange:"ffa500",orangered:"ff4500",orchid:"da70d6",palegoldenrod:"eee8aa",palegreen:"98fb98",paleturquoise:"afeeee",palevioletred:"d87093",papayawhip:"ffefd5",peachpuff:"ffdab9",peru:"cd853f",pink:"ffc0cb",plum:"dda0dd",powderblue:"b0e0e6",purple:"800080",rebeccapurple:"639",red:"f00",rosybrown:"bc8f8f",royalblue:"4169e1",saddlebrown:"8b4513",salmon:"fa8072",sandybrown:"f4a460",seagreen:"2e8b57",seashell:"fff5ee",sienna:"a0522d",silver:"c0c0c0",skyblue:"87ceeb",slateblue:"6a5acd",slategray:"708090",slategrey:"708090",snow:"fffafa",springgreen:"00ff7f",steelblue:"4682b4",tan:"d2b48c",teal:"008080",thistle:"d8bfd8",tomato:"ff6347",turquoise:"40e0d0",violet:"ee82ee",wheat:"f5deb3",white:"fff",whitesmoke:"f5f5f5",yellow:"ff0",yellowgreen:"9acd32"},g("XYZ",["x","y","z","alpha"],{fromRgb:function(){var e=function(e){return e>.04045?u((e+.055)/1.055,2.4):e/12.92},t=e(this._red),n=e(this._green),r=e(this._blue);return new m.XYZ(t*.4124564+n*.3575761+r*.1804375,t*.2126729+n*.7151522+r*.072175,t*.0193339+n*.119192+r*.9503041,this._alpha)},rgb:function(){var e=this._x,t=this._y,n=this._z,r=function(e){return e>.0031308?1.055*u(e,1/2.4)-.055:12.92*e};return new m.RGB(r(e*3.2404542+t*-1.5371385+n*-0.4985314),r(e*-0.969266+t*1.8760108+n*.041556),r(e*.0556434+t*-0.2040259+n*1.0572252),this._alpha)},lab:function(){var e=function(e){return e>.008856?u(e,1/3):7.787037*e+4/29},t=e(this._x/95.047),n=e(this._y/100),r=e(this._z/108.883);return new m.LAB(116*n-16,500*(t-n),200*(n-r),this._alpha)}}),g("LAB",["l","a","b","alpha"],{fromRgb:function(){return this.xyz().lab()},rgb:function(){return this.xyz().rgb()},xyz:function(){var e=function(e){var t=u(e,3);return t>.008856?t:(e-16/116)/7.87},t=(this._l+16)/116,n=this._a/500+t,r=t-this._b/200;return new m.XYZ(e(n)*95.047,e(t)*100,e(r)*108.883,this._alpha)}}),g("HSV",["hue","saturation","value","alpha"],{rgb:function(){var t=this._hue,n=this._saturation,r=this._value,i=a(5,e.floor(t*6)),s=t*6-i,o=r*(1-n),u=r*(1-s*n),f=r*(1-(1-s)*n),l,c,h;switch(i){case 0:l=r,c=f,h=o;break;case 1:l=u,c=r,h=o;break;case 2:l=o,c=r,h=f;break;case 3:l=o,c=u,h=r;break;case 4:l=f,c=o,h=r;break;case 5:l=r,c=o,h=u}return new m.RGB(l,c,h,this._alpha)},hsl:function(){var e=(2-this._saturation)*this._value,t=this._saturation*this._value,n=e<=1?e:2-e,r;return n<1e-9?r=0:r=t/n,new m.HSL(this._hue,r,e/2,this._alpha)},fromRgb:function(){var t=this._red,n=this._green,r=this._blue,i=e.max(t,n,r),s=a(t,n,r),o=i-s,u,f=i===0?0:o/i,l=i;if(o===0)u=0;else switch(i){case t:u=(n-r)/o/6+(n<r?1:0);break;case n:u=(r-t)/o/6+1/3;break;case r:u=(t-n)/o/6+2/3}return new m.HSV(u,f,l,this._alpha)}}),g("HSL",["hue","saturation","lightness","alpha"],{hsv:function(){var e=this._lightness*2,t=this._saturation*(e<=1?e:2-e),n;return e+t<1e-9?n=0:n=2*t/(e+t),new m.HSV(this._hue,n,(e+t)/2,this._alpha)},rgb:function(){return this.hsv().rgb()},fromRgb:function(){return this.hsv().hsl()}}),g("CMYK",["cyan","magenta","yellow","black","alpha"],{rgb:function(){return new m.RGB(1-this._cyan*(1-this._black)-this._black,1-this._magenta*(1-this._black)-this._black,1-this._yellow*(1-this._black)-this._black,this._alpha)},fromRgb:function(){var e=this._red,t=this._green,n=this._blue,r=1-e,i=1-t,s=1-n,o=1;return e||t||n?(o=a(r,a(i,s)),r=(r-o)/(1-o),i=(i-o)/(1-o),s=(s-o)/(1-o)):o=1,new m.CMYK(r,i,s,o,this._alpha)}}),m.installMethod("clearer",function(e){return this.alpha(s(e)?-0.1:-e,!0)}),m.installMethod("darken",function(e){return this.lightness(s(e)?-0.1:-e,!0)}),m.installMethod("desaturate",function(e){return this.saturation(s(e)?-0.1:-e,!0)}),m.installMethod("greyscale",y),m.installMethod("grayscale",y),m.installMethod("lighten",function(e){return this.lightness(s(e)?.1:e,!0)}),m.installMethod("mix",function(e,t){e=m(e).rgb(),t=1-(s(t)?.5:t);var n=t*2-1,r=this._alpha-e._alpha,i=((n*r===-1?n:(n+r)/(1+n*r))+1)/2,o=1-i,u=this.rgb();return new m.RGB(u._red*i+e._red*o,u._green*i+e._green*o,u._blue*i+e._blue*o,u._alpha*t+e._alpha*(1-t))}),m.installMethod("negate",function(){var e=this.rgb();return new m.RGB(1-e._red,1-e._green,1-e._blue,this._alpha)}),m.installMethod("opaquer",function(e){return this.alpha(s(e)?.1:e,!0)}),m.installMethod("rotate",function(e){return this.hue((e||0)/360,!0)}),m.installMethod("saturate",function(e){return this.saturation(s(e)?.1:e,!0)}),m.installMethod("toAlpha",function(e){var t=this.rgb(),n=m(e).rgb(),r=1e-10,i=new m.RGB(0,0,0,t._alpha),s=["_red","_green","_blue"];return s.forEach(function(e){t[e]<r?i[e]=t[e]:t[e]>n[e]?i[e]=(t[e]-n[e])/(1-n[e]):t[e]>n[e]?i[e]=(n[e]-t[e])/n[e]:i[e]=0}),i._red>i._green?i._red>i._blue?t._alpha=i._red:t._alpha=i._blue:i._green>i._blue?t._alpha=i._green:t._alpha=i._blue,t._alpha<r?t:(s.forEach(function(e){t[e]=(t[e]-n[e])/t._alpha+n[e]}),t._alpha*=i._alpha,t)})})(Math,RegExp,parseFloat,parseInt,Function,isNaN,Math.round,Math.pow,Math.min)
;


define('extplug/views/users/settings/ColorInputView',['require','exports','module','./InputView','onecolor'],function (require, exports, module) {

  var InputView = require('./InputView');
  var onecolor = require('onecolor');

  var ColorInputView = InputView.extend({
    className: 'item extplug-input extplug-color-input',

    initialize: function initialize(o) {
      this._super(o);
      this.onUpdate = this.onUpdate.bind(this);
    },

    render: function render() {
      this._super();
      this.$color = $('<div />').addClass('extplug-color-swatch');
      this.$wrapper.append(this.$color);

      this.onUpdate();
      this.on('change', this.onUpdate);
      this.$input.on('keyup', this.onUpdate);

      return this;
    },

    color: function color() {
      try {
        var c = onecolor(this.$input.val());
        if (c) return c;
      } catch (e) {}
    },

    onUpdate: function onUpdate() {
      var color = this.color();
      if (color) {
        this.$color.css({ 'background-color': color.css() });
        this.$wrapper.removeClass('error');
      } else {
        this.$wrapper.addClass('error');
      }
    },

    value: function value() {
      var color = this.color();
      return color ? this.$input.val() : '';
    }
  });

  module.exports = ColorInputView;
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


define('extplug/views/users/settings/PlaylistSelectMenuView',['require','exports','module','plug/views/grabs/grabMenu','plug/models/Media'],function (require, exports, module) {

  var GrabMenu = require('plug/views/grabs/grabMenu').constructor;
  var Media = require('plug/models/Media');
  var Lang = (0, require)('lang/Lang');

  var fakeMedia = [new Media()];

  var PlaylistSelectMenuView = GrabMenu.extend({
    className: 'pop-menu extplug-playlist-select-menu',

    // don't hide automatically on mouse leave
    onMouseLeave: function onMouseLeave() {},

    // hide immediately on hide() calls.
    // plug has a little delay in here because it auto-hides the grab
    // menu when the mouse leaves the area.
    hide: function hide() {
      this.$modal && this.$modal.remove();
      if (this._hide) this._hide();else this._super();
    },

    onRowPress: function onRowPress(playlist) {
      this.trigger('select', playlist);
      this.hide();
    },

    show: function show(el, container) {
      var _this = this;

      this._super(el, fakeMedia, container);
      this.$icon.removeClass('icon-add').addClass('icon-playlist');
      this.$title.text(Lang.playlist.yourPlaylists);

      // show the check mark in front of the selected playlist instead of the
      // active one
      this.rows.forEach(function (row) {
        if (row.model) {
          if (row.model.get('id') === _this.options.selected.get('id')) {
            row.$el.append($('<i />').addClass('icon icon-check-purple'));
          } else if (row.model.get('active')) {
            row.$el.find('.icon-check-purple').remove();
          }
        }
      });

      this.$modal = $('<div />').addClass('user-rollover-modal').on('click', this.hide.bind(this)).appendTo('body');
      this.$el.css('z-index', parseInt(this.$modal.css('z-index'), 10) + 1);

      return this;
    }
  });

  module.exports = PlaylistSelectMenuView;
});


define('extplug/views/users/settings/PlaylistSelectView',['require','exports','module','./PlaylistSelectMenuView','backbone','plug/collections/playlists'],function (require, exports, module) {

  var PlaylistSelectMenuView = require('./PlaylistSelectMenuView');

  var _require = require('backbone');

  var View = _require.View;

  var playlists = require('plug/collections/playlists');

  var PlaylistSelectView = View.extend({
    className: 'item extplug-playlist-select',

    initialize: function initialize(o) {
      this.label = o.label;
      this.description = o.description;
      this.value = o.value ? playlists.get(o.value) : playlists.at(0);
    },

    render: function render() {
      var _this = this;

      this.$label = $('<label />').addClass('title').text(this.label);
      this.$selected = $('<div />').addClass('extplug-playlist-selected').text(this.value.get('name')).on('click', function () {
        return _this.open();
      });
      this.$el.append(this.$label, this.$selected);
      return this;
    },

    open: function open() {
      var _this2 = this;

      var menu = new PlaylistSelectMenuView({
        selected: this.value
      });
      menu.show(this.$selected);
      menu.on('select', function (playlist) {
        _this2.value = playlist;
        _this2.$selected.text(_this2.value.get('name'));
        _this2.trigger('change', playlist.get('id'));
      });
    }
  });

  module.exports = PlaylistSelectView;
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


define('extplug/views/users/settings/DefaultSettingsView',['require','exports','module','./ControlGroupView','./CheckboxView','./ColorInputView','./DropdownView','./InputView','./PlaylistSelectView','./SliderView','underscore'],function (require, exports, module) {

  var ControlGroupView = require('./ControlGroupView');
  var CheckboxView = require('./CheckboxView');
  var ColorInputView = require('./ColorInputView');
  var DropdownView = require('./DropdownView');
  var InputView = require('./InputView');
  var PlaylistSelectView = require('./PlaylistSelectView');
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
    },
    text: function text(setting, value) {
      return new InputView({
        label: setting.label,
        description: setting.description,
        value: value
      });
    },
    number: function number(setting, value) {
      return new InputView({
        type: 'number',
        label: setting.label,
        description: setting.description,
        value: value,
        min: has(setting, 'min') ? setting.min : '',
        max: has(setting, 'max') ? setting.max : '',
        step: has(setting, 'step') ? setting.step : ''
      });
    },
    color: function color(setting, value) {
      return new ColorInputView({
        label: setting.label,
        description: setting.description,
        value: value
      });
    },
    playlist: function playlist(setting, value) {
      return new PlaylistSelectView({
        label: setting.label,
        description: setting.description,
        value: value
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
            // auto-remove event handlers added by the plugin, if the plugin
            // used `.listenTo()`
            _this.stopListening();
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
      var defaults = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

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
      requirejs({ paths: babelHelpers.defineProperty({}, o.name, o.url.replace(/\.js$/, '')) });
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
  "version": "0.15.4",
  "description": "Highly flexible, modular userscript extension for plug.dj.",
  "dependencies": {
    "debug": "^2.2.0",
    "es6-symbol": "^2.0.1",
    "meld": "1.x",
    "onecolor": "^2.5.0",
    "plug-modules": "^4.3.3",
    "regexp-quote": "0.0.0",
    "semver-compare": "^1.0.0",
    "sistyl": "^1.0.0"
  },
  "devDependencies": {
    "browserify": "^10.2.4",
    "del": "^1.2.0",
    "gulp": "^3.8.11",
    "gulp-babel": "^5.2.0",
    "gulp-babel-external-helpers": "^1.0.0",
    "gulp-concat": "^2.5.2",
    "gulp-data": "^1.2.0",
    "gulp-rename": "^1.2.2",
    "gulp-template": "^3.0.0",
    "gulp-zip": "^3.0.2",
    "jscs": "^1.13.1",
    "merge-stream": "^0.1.8",
    "mkdirp": "^0.5.1",
    "requirejs": "^2.1.17",
    "run-sequence": "^1.1.0",
    "vinyl-source-stream": "^1.1.0"
  },
  "scripts": {
    "build": "gulp build",
    "test": "jscs src"
  },
  "builtAt": 1440232963374
});


define('extplug/plugins/CommandsPlugin',['require','exports','module','../Plugin','../package'],function (require, exports, module) {
  var Plugin = require('../Plugin');
  var _package = require('../package');

  // version info
  var pad = function pad(x) {
    return x < 10 ? '0' + x : x;
  };
  var ba = new Date(_package.builtAt);
  var builtAt = ba.getUTCFullYear() + '-' + pad(ba.getUTCMonth() + 1) + '-' + pad(ba.getUTCDate() + 1) + ' ' + pad(ba.getUTCHours() + 1) + ':' + pad(ba.getUTCMinutes() + 1) + ':' + pad(ba.getUTCSeconds() + 1) + ' UTC';

  var CommandsPlugin = Plugin.extend({
    name: 'Chat Commands',
    description: 'Defines default ExtPlug chat commands.',

    commands: {
      version: 'showVersion',
      reloadsettings: 'reloadRoomSettings',
      disable: 'disableExtPlug'
    },

    showVersion: function showVersion() {
      API.chatLog(_package.name + ' v' + _package.version + ' (' + builtAt + ')');
    },

    reloadRoomSettings: function reloadRoomSettings() {
      API.chatLog('Reloading room settings...');
      this.ext.roomSettings.once('load', function () {
        return API.chatLog('...Done!');
      }).reload();
    },

    disableExtPlug: function disableExtPlug() {
      API.chatLog('Disabling ExtPlug! ' + 'You cannot re-enable ExtPlug until the next refresh.');
      this.ext.disable();
    }
  });

  module.exports = CommandsPlugin;
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


define('extplug/plugins/SettingsTabPlugin',['require','exports','module','meld','plug/core/Events','plug/views/users/UserView','plug/views/users/settings/SettingsView','../Plugin','../views/users/settings/TabMenuView','../views/users/settings/SettingsView'],function (require, exports, module) {
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


define('extplug/plugins/ChatTypePlugin',['require','exports','module','meld','underscore','plug/core/Events','plug/views/rooms/chat/ChatView','plug/util/util','plug/util/emoji','plug/store/settings','../Plugin'],function (require, exports, module) {
  var _require = require('meld');

  var around = _require.around;

  var _require2 = require('underscore');

  var uniqueId = _require2.uniqueId;
  var find = _require2.find;

  var Events = require('plug/core/Events');
  var ChatView = require('plug/views/rooms/chat/ChatView');
  var util = require('plug/util/util');
  var emoji = require('plug/util/emoji');
  var settings = require('plug/store/settings');
  var Plugin = require('../Plugin');

  /**
   * The ChatType Plugin adds a bunch of useful options to chat message
   * objects. Any chat messages passed through the ChatView "onReceived"
   * handler will be affected, so in particular all "chat:receive" events
   * are handled properly.
   *
   *  * the "badge" property can contain an emoji name (eg ":eyes:") or
   *    an icon class (eg "icon-plugdj") as well as the standard badge
   *    names. Only 30*30px icons will be aligned properly.
   *  * the "color" property takes a CSS colour, which will be used for
   *    the message text.
   *  * the "timestamp" property always defaults to the current time if
   *    it is left empty.
   *  * the "classes" property can contain a string of CSS classes. This
   *    is preferable to adding multiple classes in the "type" property,
   *    because other code might want to _check_ the "type" property and
   *    won't expect to find more than one type.
   */
  var ChatTypePlugin = Plugin.extend({
    enable: function enable() {
      var _this = this;

      // chatView.onReceived will still be the old method after adding advice
      // so the event listener should also be swapped out
      this.replaceEventHandler(function () {
        _this._chatTypeAdvice = around(ChatView.prototype, 'onReceived', _this.onReceived);
      });
    },
    disable: function disable() {
      var _this2 = this;

      // remove custom chat type advice, and restore
      // the original event listener
      this.replaceEventHandler(function () {
        _this2._chatTypeAdvice.remove();
      });
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
      // add cid if it doesn't exist, to prevent a `.cid-undefined` selector
      // from catching everything
      if (!message.cid) {
        message.cid = uniqueId('extp-');
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
          if (emoji.map.colons[emojiName]) {
            badgeBox.find('i').remove();
            badgeBox.append($('<span />').addClass('emoji-glow extplug-badji').append($('<span />').addClass('emoji emoji-' + emoji.map.colons[emojiName])));
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
    },

    // replace callback without affecting calling order
    replaceEventHandler: function replaceEventHandler(fn) {
      var chatView = this.ext.appView.room.chat;
      var handler = undefined;
      if (chatView) {
        handler = find(Events._events['chat:receive'], function (e) {
          return e.callback === chatView.onReceived;
        });
      }
      fn();
      if (chatView) {
        if (!handler) {
          throw new Error('Could not replace chat handler');
        }
        handler.callback = chatView.onReceived;
      }
    }
  });

  module.exports = ChatTypePlugin;
});


define('extplug/plugins/MoreChatEventsPlugin',['require','exports','module','../Plugin','plug/facades/chatFacade','plug/models/currentUser','plug/models/currentRoom','plug/views/rooms/chat/ChatView','plug/core/Events','underscore','meld','jquery'],function (require, exports, module) {

  var Plugin = require('../Plugin');
  var chatFacade = require('plug/facades/chatFacade');
  var currentUser = require('plug/models/currentUser');
  var currentRoom = require('plug/models/currentRoom');
  var ChatView = require('plug/views/rooms/chat/ChatView');
  var Events = require('plug/core/Events');

  var _require = require('underscore');

  var find = _require.find;

  var _require2 = require('meld');

  var before = _require2.before;
  var after = _require2.after;
  var joinpoint = _require2.joinpoint;

  var $ = require('jquery');

  // Adds a bunch of new chat events.
  // "chat:incoming" is fired as soon as a new message is received from the socket.
  //   It gets three arguments: The Message object, a boolean `isSystemMessage`, and
  //   a boolean `isMine` (true if the current user sent the message.)
  function fireIncoming(message, isSystemMessage, isMine) {
    Events.trigger('chat:incoming', message, isSystemMessage, isMine);
  }
  // "chat:beforereceive" is fired after some initial processing, but before the message
  // is passed to the plug.dj view layer. This is where you probably want to do your
  // modifications to the Message object.
  function fireBeforeReceive(message, isSystemMessage) {
    Events.trigger('chat:beforereceive', message, isSystemMessage);
  }
  // "chat:afterreceive" is fired after the message has been rendered. It gets two arguments:
  //   The Message object, and a jQuery object containing the message DOM element.
  function fireAfterReceive(message) {
    var element = $('#chat-messages .cm:last-child');
    Events.trigger('chat:afterreceive', message, element);
  }
  // "chat:send" is fired when the user sends a message. It takes a single argument: A string
  //   with the text content of the message.
  function fireSend(message) {
    // ensure that the user is allowed to send a message.
    // this does _not_ check for mutes. Plug will pretend that your message
    // went through if you're muted--so we do the same.
    if (currentUser.get('guest') || !currentRoom.get('joined') || currentUser.get('level') < currentRoom.get('minChatLevel') || message[0] === '/') {
      return;
    }
    Events.trigger('chat:send', message);
  }

  var MoreChatEvents = Plugin.extend({
    name: 'More Chat Events',
    description: 'Adds more chat events for plugins to hook into.',

    enable: function enable() {
      var _this = this;

      Events.on('chat:receive', fireBeforeReceive);
      // ensure fireBeforeReceive is the first event handler to be called
      Events._events['chat:receive'].unshift(Events._events['chat:receive'].pop());
      this.incomingAdvice = before(chatFacade, 'onChatReceived', fireIncoming);
      this.replaceEventHandler(function () {
        _this.afterReceiveAdvice = after(ChatView.prototype, 'onReceived', function () {
          fireAfterReceive.apply(undefined, babelHelpers.toConsumableArray(joinpoint().args));
        });
      });
      this.sendAdvice = before(chatFacade, 'sendChat', fireSend);
    },

    disable: function disable() {
      this.incomingAdvice.remove();
      this.afterReceiveAdvice.remove();
      this.sendAdvice.remove();
      Events.off('chat:receive', fireBeforeReceive);
    },

    // replace callback without affecting calling order
    replaceEventHandler: function replaceEventHandler(fn) {
      var chatView = this.ext.appView.room.chat;
      var handler = undefined;
      if (chatView) {
        handler = find(Events._events['chat:receive'], function (e) {
          return e.callback === chatView.onReceived;
        });
      }
      fn();
      if (chatView && handler) {
        handler.callback = chatView.onReceived;
      }
    }
  });

  module.exports = MoreChatEvents;
});


define('extplug/util/getUserClasses',['require','exports','module'],function (require, exports, module) {

  var API = window.API;

  // CSS classes for room-specific roles
  var roleClasses = ['user', 'dj', 'bouncer', 'manager', 'cohost', 'host'];
  // CSS classes for global roles
  var gRoleClasses = ['none', '', '', 'ambassador', '', 'admin'];

  /**
   * Gets RCS-style user CSS classes for the given user ID. Added classes are:
   *
   *   * "id-${USER_ID}" for the user ID;
   *   * "role-host/cohost/manager/bouncer/user" for room-specific roles;
   *   * "role-admin/ambassador/none" for global roles;
   *   * "role-friend" for friends;
   *   * "role-subscriber" for subscribers;
   *   * "role-you" for the current user.
   *
   * All these classes are additive, so if you have a friend who is a manager
   * in the current room, they will receive all of the following classes:
   *
   *     "id-${THEIR_ID} role-manager role-none role-friend"
   */
  function getUserClasses(uid) {
    var classes = [];
    var user = API.getUser(uid);

    classes.push('id-' + uid);
    if (user) {
      // role classes
      classes.push('role-' + roleClasses[user.role || 0]);
      classes.push('role-' + gRoleClasses[user.gRole || 0]);

      // speeeecial classes :sparkles:
      if (user.friend) classes.push('role-friend');
      if (user.sub) classes.push('role-subscriber');
      if (user.id === API.getUser().id) classes.push('role-you');
    }

    return classes;
  }

  module.exports = getUserClasses;
  getUserClasses.roleClasses = roleClasses;
  getUserClasses.gRoleClasses = gRoleClasses;
});


define('extplug/plugins/UserClassesPlugin',['require','exports','module','../Plugin','../util/getUserClasses','plug/core/Events','plug/models/currentUser','plug/views/rooms/users/RoomUserRowView','plug/views/rooms/users/WaitListRowView','plug/views/users/userRolloverView','meld','underscore'],function (require, exporst, module) {

  var Plugin = require('../Plugin');
  var getUserClasses = require('../util/getUserClasses');
  var Events = require('plug/core/Events');
  var currentUser = require('plug/models/currentUser');
  var UserRowView = require('plug/views/rooms/users/RoomUserRowView');
  var WaitListRowView = require('plug/views/rooms/users/WaitListRowView');
  var userRolloverView = require('plug/views/users/userRolloverView');

  var _require = require('meld');

  var after = _require.after;

  var _require2 = require('underscore');

  var defer = _require2.defer;

  var r = API.ROLE;
  var roleClasses = getUserClasses.roleClasses;

  var UserClasses = Plugin.extend({
    name: 'User Classes',
    description: 'Adds some CSS classes for roles and IDs to various places.',

    enable: function enable() {
      this.listenTo(Events, 'chat:beforereceive', this.onChat);

      var plugin = this;
      // common advice for user lists
      var rowAdvice = function rowAdvice() {
        // `this` is the row view
        var id = this.model.get('id');
        if (id) {
          this.$el.addClass(getUserClasses(id).join(' '));
        }
      };
      this.rowClasses = after(UserRowView.prototype, 'draw', rowAdvice);
      this.waitListClasses = after(WaitListRowView.prototype, 'render', rowAdvice);
      this.rolloverClasses = after(userRolloverView, 'showSimple', function () {
        // `this` is the rollover view
        var id = this.user.get('id');
        if (id) {
          this.$el.addClass(getUserClasses(id).join(' '));
        }
      });
      this.onUserChange();
      // guest change, mostly
      this.listenTo(currentUser, 'change:id change:role change:gRole', this.onUserChange);
    },
    disable: function disable() {
      this.rowClasses.remove();
      this.waitListClasses.remove();
      this.rolloverClasses.remove();
    },

    onChat: function onChat(msg) {
      var classes = msg.classes ? [msg.classes] : [];
      if (msg.uid) {
        classes.push.apply(classes, babelHelpers.toConsumableArray(getUserClasses(msg.uid)));
        // additional plugCubed chat-only classes
        // PlugCubed's classes start with `from-` instead of `role-` so we can't
        // just use getUserClasses()
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
          classes.push('from-' + roleClasses[user.role]);
        }
      }

      if (msg.sub) {
        classes.push('from-subscriber');
      }

      msg.classes = classes.join(' ');
    },

    onUserChange: function onUserChange() {
      this.setUserViewClass();
      this.setUserFooterClass();
    },

    setUserViewClass: function setUserViewClass() {
      defer(function () {
        $('#user-view').removeClass().addClass('app-left').addClass(getUserClasses(API.getUser().id).join(' '));
      });
    },

    setUserFooterClass: function setUserFooterClass() {
      defer(function () {
        var footer = $('#footer-user');
        var online = footer.hasClass('online');
        var showing = footer.hasClass('showing');
        footer.removeClass().toggleClass('online', online).toggleClass('showing', showing).addClass(getUserClasses(API.getUser().id).join(' '));
      });
    }
  });

  module.exports = UserClasses;
});


define('extplug/plugins/TooltipsPlugin',['require','exports','module','../Plugin','plug/core/Events','jquery'],function (require, exports, module) {

  var Plugin = require('../Plugin');
  var Events = require('plug/core/Events');
  var $ = require('jquery');

  var TooltipsPlugin = Plugin.extend({
    name: 'Tooltips',
    description: 'Provides super easy tooltips using data attributes.',

    enable: function enable() {
      this._doc = $(document).on('mouseenter.extplug.core.tooltips', '[data-tooltip]', this.onEnter).on('mouseleave.extplug.core.tooltips', '[data-tooltip]', this.onLeave);
    },

    disable: function disable() {
      this._doc.off('.extplug.tooltips');
    },

    onEnter: function onEnter(e) {
      var target = $(e.target).closest('[data-tooltip]');
      var dir = target.attr('data-tooltip-dir');
      var alignLeft = dir && dir.toLowerCase() === 'left';
      Events.trigger('tooltip:show', target.attr('data-tooltip'), target, alignLeft);
    },
    onLeave: function onLeave(e) {
      Events.trigger('tooltip:hide');
    }

  });

  module.exports = TooltipsPlugin;
});


define('extplug/plugins/GuestPlugin',['require','exports','module','jquery','meld','../Plugin','plug/core/Events','plug/actions/users/SaveSettingsAction','lang/Lang'],function (require, exports, module) {

  var $ = require('jquery');

  var _require = require('meld');

  var around = _require.around;

  var Plugin = require('../Plugin');
  var Events = require('plug/core/Events');
  var SaveSettingsAction = require('plug/actions/users/SaveSettingsAction');
  var Lang = require('lang/Lang');

  var GuestPlugin = Plugin.extend({
    name: 'Guest UI',
    description: 'Skips the guest walkthrough and adds login and settings ' + 'buttons to the plug.dj footer.',

    style: {
      '.is-guest': {
        '#header-panel-bar': {
          '#chat-button': {
            'width': '33%',
            'span': { 'display': 'none' }
          },
          '#users-button': {
            'left': '33%',
            'width': '34%'
          },
          '#waitlist-button': {
            'left': '67%',
            'width': '33%'
          },
          '#friends-button': { 'display': 'none' }
        },
        '#user-lists': {
          // even the staff one doesn't work for guest users!
          '.button.staff, .button.ignored': { 'display': 'none' }
        },
        '#footer-user': {
          '.signup': { 'width': '40%' },
          '.signup.login': {
            'margin-left': 'calc(40% + 1px)',
            'width': 'calc(40% - 1px)',
            'background': '#555d70'
          },
          '.buttons': {
            'display': 'block',
            '.button': { 'display': 'none' },
            '.button.extplug-guest-settings': {
              'display': 'block',
              'margin-left': '80%'
            }
          }
        },
        '#user-menu .item:not(.settings)': {
          'display': 'none'
        },
        '#room-bar': {
          '.extplug-room-bar-overlay': {
            'height': 'inherit',
            'width': 'inherit',
            'position': 'absolute',
            'z-index': 10
          }
        }
      }
    },

    enable: function enable() {
      // Presumably, this isn't the first time someone has used plug.dj.
      this.skipWalkthrough();

      this.$settings = $('<div />').addClass('button settings extplug-guest-settings').attr('data-tooltip', Lang.userMenu.settings).attr('data-tooltip-dir', 'left').append($('<i />').addClass('icon icon-settings-white')).appendTo('#footer-user .buttons').on('click', this.onSettings);

      // add login button
      this.$signup = $('#footer-user .signup').find('span').text(Lang.signup.signup).end();
      this.$login = $('<div />').addClass('signup login').append($('<span />').text(Lang.signup.login)).insertAfter(this.$signup).on('click', this.login.bind(this));

      // disable saving settings to the server when not logged in
      this.ssaAdvice = around(SaveSettingsAction.prototype, 'execute', function () {
        // do nothing \o/
      });

      this.$roomBar = $('<div />').addClass('extplug-room-bar-overlay').appendTo('#room-bar').on('click', function (e) {
        e.stopPropagation();
        if ($('#room-settings').is(':visible')) {
          Events.trigger('hide:settings');
        } else {
          Events.trigger('show:settings');
        }
      });

      this._enabled = true;
    },

    disable: function disable() {
      if (this._enabled) {
        this.ssaAdvice.remove();
        this.$settings.remove();
        this.$roomBar.remove();
        this.$login.remove();
        this.$signup.find('span').text(Lang.signup.signupFree);
        this.$settings = this.$login = this.$signup = null;
      }

      this._enabled = false;
    },

    skipWalkthrough: function skipWalkthrough() {
      var roomView = this.ext.appView.room;
      roomView.onWTFinish();
    },

    login: function login() {
      var app = this.ext.appView;
      app.showSignUp();
      app.signup.swap('login');
      // show email login by default
      $('.sign-up-overlay .box').addClass('show-email');
      $('.email-login input.email').focus();
    },

    onSettings: function onSettings(e) {
      e.stopPropagation();
      Events.trigger('tooltip:hide').trigger('show:user', 'settings', 'extplug');
    }

  });

  module.exports = GuestPlugin;
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


define('extplug/hooks/api-early',['require','exports','module','meld'],function (require, exports, module) {

  var meld = require('meld');

  function intercept(joinpoint) {
    var _joinpoint$args = babelHelpers.toArray(joinpoint.args);

    var eventName = _joinpoint$args[0];

    var params = _joinpoint$args.slice(1);

    API.trigger.apply(API,
    // userLeave → beforeUserLeave
    ['before' + eventName.charAt(0).toUpperCase() + eventName.slice(1)].concat(babelHelpers.toConsumableArray(params)));

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
    'content': '"EXT"',
    'color': '#fff',
    'background': '#f00',
    'z-index': 10,
    'font-size': '70%',
    'border-radius': '10px',
    'padding': '1px 4px',
    'margin-top': '5px',
    'position': 'relative',
    'float': 'right'
  }
});
// inline chat messages show the message contents immediately after
// the username instead of below it.


define('extplug/styles/inline-chat',{
  '#chat-messages .cm.inline': {
    'min-height': '0',

    '.badge-box': {
      // remove badge background
      'margin': '5px 8px 6px',
      'height': '16px',
      'border-radius': '0px',
      'background': 'transparent',

      // center badge icons
      '.icon': {
        'top': '50%',
        'margin-top': '-15px'
      },

      // center & resize actual user badges
      '.bdg': {
        'top': '-7px',
        'transform': 'scale(0.5)'
      },

      // emoji badges
      '.extplug-badji': {
        'left': '7px'
      }
    },
    '.from': { 'display': 'inline' },
    '.text': { 'display': 'inline', 'margin-left': '5px' },
    '.delete-button': {
      'padding': '3px 10px',
      'top': '3px'
    }
  },
  // remove the empty circle for badge-less users
  // (it doesn't fit in a 16px high message)
  '#chat-messages .cm .no-badge .icon': {
    'width': '30px',
    'height': '30px',
    'top': '0px',
    'left': '0px',
    'border': 'none',
    'border-radius': '0px'
  }
});


define('extplug/styles/settings-pane',{
  '#user-view #user-settings': {
    // unlike plug.dj's own settings, ExtPlug settings are grouped
    // in separate DOM elements (separate backbone views, even)
    // plug.dj's styling doesn't quite work for this so we add some
    // manual margins around the header to make things look somewhat
    // alike.
    '.extplug.control-group:not(:first-child) .header': {
      'margin': '35px 0 8px 0 !important'
    },

    // footer below grouped plugin settings
    '.extplug-group-footer': {
      'clear': 'both',
      'button': {
        'top': 'auto',
        'position': 'relative'
      }
    },

    // numeric range slider
    '.extplug-slider': {
      // plug.dj has three labels on sliders, but ExtPlug sliders
      // just have two counter labels because it's easier
      '.counts .count:nth-child(2)': {
        'float': 'right'
      }
    },

    'label.title': {
      'top': '0px',
      'font-size': '14px',
      'width': '50%'
    },

    '.extplug-input': {
      '.extplug-input-wrap': {
        'position': 'absolute',
        'background': '#212328',
        'box-shadow': 'inset 0 0 0 1px #444a59',
        'box-sizing': 'border-box',
        'height': '31px',
        'padding': '1px',
        'width': '47%',
        'left': '50%',
        'top': '-6px'
      },
      'input': {
        'padding': '1px 1px 1px 5px',
        'height': '29px',
        'width': '100%',
        'box-sizing': 'border-box',
        'font': '14px "Open Sans", sans-serif',
        'color': '#ccc',
        'background': 'transparent',
        'border': 'none'
      },
      '.error': {
        // someone decided to !important the default .focused style ):
        'box-shadow': 'inset 0 0 0 1px #f04f30 !important'
      }
    },

    // colour inputs
    '.extplug-color-input': {
      '.extplug-color-swatch': {
        'height': '23px',
        'width': '23px',
        'top': '4px',
        'left': '4px',
        'position': 'absolute'
      },
      'input': {
        'width': 'calc(100% - 29px)',
        'margin-left': '29px'
      }
    },

    // playlist select
    '.extplug-playlist-select': {
      '.extplug-playlist-selected': {
        'background': '#282c35',
        // positioning
        'margin-left': '50%',
        'width': '50%',
        'padding': '7px',
        'margin': '-7px 0 -7px 50%',
        'position': 'absolute',
        'box-sizing': 'border-box',
        // cut off long playlist names
        'white-space': 'nowrap',
        'text-overflow': 'ellipsis',
        'overflow': 'hidden'
      }
    }
  },

  '.extplug-playlist-select-menu': {
    '.icon-playlist': {
      'top': '9px',
      'left': '9px'
    }
  }
});


define('extplug/styles/install-plugin-dialog',{
  '#dialog-install-plugin': {
    // magic numbers! stolen from other plug.dj dialogs
    '.dialog-body': { 'height': '137px' },
    '.message': { 'top': '21px' },
    // centered spinner
    '.spinner': { 'top': '50%', 'left': '50%' },
    // Plugin URL input, center-aligned and wide
    '.dialog-input-background': {
      'top': '67px',
      'width': '460px',
      'height': '43px',
      'left': '25px',
      'input': {
        'width': '440px'
      }
    }
  }
});


define('extplug/ExtPlug',['require','exports','module','plug/core/Events','plug/views/app/ApplicationView','plug/models/currentUser','./store/settings','./models/RoomSettings','./models/PluginMeta','./collections/PluginsCollection','./Plugin','./pluginLoader','./plugins/CommandsPlugin','./plugins/SettingsTabPlugin','./plugins/ChatTypePlugin','./plugins/MoreChatEventsPlugin','./plugins/UserClassesPlugin','./plugins/TooltipsPlugin','./plugins/GuestPlugin','./package','underscore','semver-compare','./hooks/waitlist','./hooks/api-early','./hooks/playback','./hooks/settings','./hooks/popout-style','./styles/badge','./styles/inline-chat','./styles/settings-pane','./styles/install-plugin-dialog'],function (require, exports, module) {

  var Events = require('plug/core/Events');
  var ApplicationView = require('plug/views/app/ApplicationView');
  var currentUser = require('plug/models/currentUser');

  var settings = require('./store/settings');
  var RoomSettings = require('./models/RoomSettings');
  var PluginMeta = require('./models/PluginMeta');
  var PluginsCollection = require('./collections/PluginsCollection');
  var Plugin = require('./Plugin');
  var pluginLoader = require('./pluginLoader');

  var CommandsPlugin = require('./plugins/CommandsPlugin');
  var SettingsTabPlugin = require('./plugins/SettingsTabPlugin');
  var ChatTypePlugin = require('./plugins/ChatTypePlugin');
  var MoreChatEventsPlugin = require('./plugins/MoreChatEventsPlugin');
  var UserClassesPlugin = require('./plugins/UserClassesPlugin');
  var TooltipsPlugin = require('./plugins/TooltipsPlugin');
  var GuestPlugin = require('./plugins/GuestPlugin');

  var _package = require('./package');

  var _ = require('underscore');
  var semvercmp = require('semver-compare');

  var hooks = [require('./hooks/waitlist'), require('./hooks/api-early'), require('./hooks/playback'), require('./hooks/settings'), require('./hooks/popout-style')];

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

      this._core = [new CommandsPlugin('chat-commands', this), new SettingsTabPlugin('settings-tab', this), new MoreChatEventsPlugin('more-chat-events', this), new ChatTypePlugin('custom-chat-type', this), new UserClassesPlugin('user-classes', this), new TooltipsPlugin('tooltips', this)];

      this._guest = new GuestPlugin('guest', this);
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

      API.enabled = true;

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

      if (currentUser.get('guest')) {
        this._guest.enable();
        currentUser.once('change:guest', function () {
          _this3._guest.disable();
        });
      }

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

      this._guest.disable();

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
          stored.installed.splice(i, 1, url + ';' + name);
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

  function isReady() {
    return window.require &&
      window.define &&
      window.API &&
      // wait for plug.dj to finish rendering
      // the previous checks are not enough: the AppView can take a long time to
      // load because of external twitter & fb dependencies, whereas the API
      // modules load quickly
      window.jQuery && window.jQuery('#room').length > 0;
  }

}());
