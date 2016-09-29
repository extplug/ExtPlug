import plugModules from 'plug-modules';
import { extend, methods } from 'underscore';

/**
 * Compatibility: Add an extend() method to ES6 classes that behaves like
 * plug.dj's own Backbone-style `require('plug/core/Class').extend()`.
 */
// eslint-disable-next-line no-extend-native
Function.prototype.extend = function extendClass(props, staticProps) {
  const Super = this;
  class Sub extends Super {}

  extend(Sub.prototype, props);
  extend(Sub, staticProps);

  // Fake super calls.
  methods(props).forEach((prop) => {
    Sub.prototype[prop] = function superWrap(...args) {
      const oldSuper = this._super;
      this._super = Super.prototype[prop];
      const result = props[prop].apply(this, args);
      this._super = oldSuper;
      return result;
    };
  });

  return Sub;
};

const EXTPLUG_MODULE = 'extplug/__internalExtPlug__';

function waitFor(cond, fn) {
  const i = setInterval(() => {
    if (cond()) {
      clearInterval(i);
      fn();
    }
  }, 20);
}

function appViewExists() {
  try {
    // the ApplicationView attaches an event handler on instantiation.
    const AppView = plugModules.require('plug/views/app/ApplicationView');
    const Events = plugModules.require('plug/core/Events');
    const evts = Events._events['show:room']; // eslint-disable-line no-underscore-dangle
    return evts.some(event => event.ctx instanceof AppView);
  } catch (e) {
    return false;
  }
}

plugModules.run();
plugModules.register();

waitFor(appViewExists, () => {
  window.define('extplug', [EXTPLUG_MODULE], ExtPlug => new ExtPlug());

  window.requirejs(['extplug'], (ext) => {
    window.requirejs.undef(EXTPLUG_MODULE);

    window.extp = ext;
    ext.enable();
  });
});
