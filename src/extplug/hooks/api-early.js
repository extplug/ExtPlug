define(function (require, exports, module) {

  var meld = require('meld');

  function intercept(joinpoint) {
    let [ eventName, ...params ] = joinpoint.args;

    API.trigger.apply(
      API,
      // userLeave → beforeUserLeave
      [ 'before' + eventName.charAt(0).toUpperCase() + eventName.slice(1), ...params ]
    );

    return joinpoint.proceed();
  }

  function nop() { return 'Dummy handler to ensure that plug.dj actually triggers the event'; }

  // find default plug.dj API event names
  var eventKeys = Object.keys(API).filter(function (key) {
    return key.toUpperCase() === key && typeof API[key] === 'string';
  });

  var advice;
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