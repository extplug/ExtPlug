define(function () {

  const plugModules = require('plug-modules');

  plugModules.run();
  plugModules.register();

  let timer = null;
  require([ 'extplug/ExtPlug' ], function _loaded(ExtPlug) {
    if (appViewExists()) {
      var ext = new ExtPlug();
      window.extp = ext;

      ext.enable();
      if (timer) {
        clearInterval(timer);
      }
    }
    else if (!timer) {
      timer = setInterval(() => {
        _loaded(ExtPlug);
      }, 20);
    }
  });

  function appViewExists() {
    try {
      // the ApplicationView attaches an event handler on instantiation.
      const AppView = plugModules.require('plug/views/app/ApplicationView'),
        Events = plugModules.require('plug/core/Events');
      let evts = Events._events['show:room'];
      return evts.some(event => event.ctx instanceof AppView);
    }
    catch (e) {
      return false;
    }
  }

});
