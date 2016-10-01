/**
 * ExtPlug loader. Waits for the necessary plug.dj code to load before running
 * ExtPlug.
 * This is necessary because plug.dj loads require.js lazily. Since ExtPlug uses
 * require.js modules for everything, it can't run until require.js is loaded.
 * This file waits for require.js to load, and also for plug.dj's own javascript
 * to run (i.e. for the API variable to exist) while we're at it.
 */

/* eslint-disable no-var, vars-on-top */
(function load() {
  var isReady = window.require &&
    window.define &&
    window.API &&
    // wait for plug.dj to finish rendering
    // the previous checks are not enough: the AppView can take a long time to
    // load because of external twitter & fb dependencies, whereas the API
    // modules load quickly
    window.jQuery && window.jQuery('#room').length > 0;

  // Stub out some libraries used by plug.dj that may not load in time otherwise
  // (e.g. because of adblockers or because plug.dj's loading sequence has race
  // conditions)
  window.gapi = window.gapi || {};
  window.Intercom = window.Intercom || {};
  window.amplitude = window.amplitude || { __VERSION__: true };

  if (isReady) {
    // Tampermonkey doesn't appear to find some of the global functions by
    // default, so we redefine them here as local vars.
    /* eslint-disable no-unused-vars */
    var requirejs = window.requirejs;
    var require = window.requirejs;
    var define = window.define;
    /* eslint-enable no-unused-vars */

    CODE; // eslint-disable-line

    // eslint-disable-next-line import/no-dynamic-require
    require(['extplug/loader']);
  } else {
    setTimeout(load, 20);
  }
}());
/* eslint-enable no-var, vars-on-top */
