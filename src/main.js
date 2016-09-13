import plugModules from 'plug-modules';

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
