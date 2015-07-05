define(function (require, exports, module) {

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
   * @deprecated
   *
   * @param {Object} obj Base object.
   * @param {string} key Method name.
   */
  exports.bound = function (obj, key) {
    console.warn('extplug/util/function.bound is deprecated, ' +
                 'use Function.prototype.bind instead');
    obj[key] = obj[key].bind(obj);
  };

});
