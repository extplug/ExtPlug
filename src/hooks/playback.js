import Events from 'plug/core/Events';

function onRefresh() { Events.trigger('playback:refresh'); }
function onHd() { Events.trigger('playback:hdVideo'); }
function onSnooze() { Events.trigger('playback:snooze'); }

export function install() {
  $('#playback .refresh.button').on('click', onRefresh);
  $('#playback .hd.button').on('click', onHd);
  $('#playback .snooze.button').on('click', onSnooze);
};

export function uninstall() {
  $('#playback .refresh.button').off('click', onRefresh);
  $('#playback .hd.button').off('click', onHd);
  $('#playback .snooze.button').off('click', onSnooze);
};
