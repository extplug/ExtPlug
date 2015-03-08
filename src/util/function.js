define('extplug/util/function', function (require, exports, module) {

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
