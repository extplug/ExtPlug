import $ from 'jquery';
import Events from 'plug/core/Events';
import popoutView from 'plug/views/rooms/popout/PopoutView';

function sync() {
  _.defer(() => {
    popoutView.$document.find('head').append($('.extplug-style').clone());
  });
}

export function install() {
  Events.on('popout:show', sync);
};

export function uninstall() {
  Events.off('popout:show', sync);
};
