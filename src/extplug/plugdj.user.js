;(function _initExtPlug() {

  if (window.API) {
    plugModules.register();
    require([ 'extplug/ExtPlug' ], function _loaded(ExtPlug) {
      if (!appViewExists()) {
        return setTimeout(function () {
          _loaded(ExtPlug)
        }, 20);
      }

      var cbs = window.extp || [];
      var ext = new ExtPlug();
      window.extp = ext;

      ext.init();
      cbs.forEach(function (cb) {
        ext.push(cb);
      });

    });
  }
  else {
    setTimeout(_initExtPlug, 20);
  }

  function appViewExists() {
    try {
      // the ApplicationView attaches an event handler on instantiation.
      var AppView = plugModules.require('plug/views/app/ApplicationView'),
        evts = plugModules.require('plug/core/Events')._events['show:room'];
      return evts.some(function (event) { return event.ctx instanceof AppView; });
    }
    catch (e) {
      return false;
    }
  }

}());
