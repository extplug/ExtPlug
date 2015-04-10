define(function (require, exports, module) {

  var Events = require('plug/core/Events');

  function onRefresh() { Events.trigger('playback:refresh'); }
  function onHd() { Events.trigger('playback:hdVideo'); }
  function onSnooze() { Events.trigger('playback:snooze'); }

  exports.install = function () {
    $('#playback .refresh.button').on('click', onRefresh);
    $('#playback .hd.button').on('click', onHd);
    $('#playback .snooze.button').on('click', onSnooze);
  };

  exports.uninstall = function () {
    $('#playback .refresh.button').off('click', onRefresh);
    $('#playback .hd.button').off('click', onHd);
    $('#playback .snooze.button').off('click', onSnooze);
  };

});