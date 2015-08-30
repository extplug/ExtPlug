import plugModules from 'plug-modules';

function waitFor(cond, fn) {
  let i = setInterval(() => {
    if (cond()) {
      clearInterval(i);
      fn();
    }
  }, 20);
}

plugModules.run();
plugModules.register();

require([ 'extplug/ExtPlug' ], function _loaded(ExtPlug) {
  waitFor(appViewExists, () => {
    let ext = new ExtPlug();
    window.extp = ext;

    ext.enable();
  });
});

function appViewExists() {
  try {
    // the ApplicationView attaches an event handler on instantiation.
    const AppView = plugModules.require('plug/views/app/ApplicationView');
    const Events = plugModules.require('plug/core/Events');
    let evts = Events._events['show:room'];
    return evts.some(event => event.ctx instanceof AppView);
  }
  catch (e) {
    return false;
  }
}
