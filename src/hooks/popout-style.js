define(function (require, exports, module) {

  const $ = require('jquery');
  const Events = require('plug/core/Events');
  const popoutView = require('plug/views/rooms/popout/PopoutView');

  function sync() {
    _.defer(() => {
      popoutView.$document.find('head').append($('.extplug-style').clone());
    });
  }

  exports.install = function () {
    Events.on('popout:show', sync);
  };

  exports.uninstall = function () {
    Events.off('popout:show', sync);
  };

});
