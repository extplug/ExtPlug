import plugModules from 'plug-modules';

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

window.require(['extplug/ExtPlug'], ExtPlug => {
  waitFor(appViewExists, () => {
    const ext = new ExtPlug();
    window.extp = ext;

    ext.enable();
  });
});
