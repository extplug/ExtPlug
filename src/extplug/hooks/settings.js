define(function (require, exports, module) {

  // Mirrors plug.dj settings to the ExtPlug settings model.

  const { before } = require('meld');
  const plugSettings = require('plug/store/settings');
  const extMirror = require('../store/settings');

  let advice;

  exports.install = function () {
    advice = before(plugSettings, 'save', extMirror.update);
  };

  exports.uninstall = function () {
    advice.remove();
  };

});
