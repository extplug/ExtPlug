/* global requirejs, EXTPLUG_HOT_RELOAD_ENTRY_URL */

/**
 * This file is a stub that loads ExtPlug from the Webpack development server.
 */

requirejs.config({
  paths: {
    'extplug/__internalExtPlug__':
      // Remove trailing .js, requirejs will add it back.
      EXTPLUG_HOT_RELOAD_ENTRY_URL.replace(/\.js$/, ''),
  },
});

console.info('ExtPlug: Development mode');

/*
define('extplug/__internalExtPlug__', [EXTPLUG_HOT_RELOAD_ENTRY_URL], function (ExtPlug) {
  console.info('ExtPlug: Development mode', arguments);
  return ExtPlug.default;
});
*/
