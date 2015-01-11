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

  exports.bound = function (obj, key) {
    obj[key] = obj[key].bind(obj);
  };

});
