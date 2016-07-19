import $ from 'jquery';
import { defer } from 'underscore';
import Events from 'plug/core/Events';
import popoutView from 'plug/views/rooms/popout/PopoutView';
import Plugin from '../Plugin';

const PopoutStylePlugin = Plugin.extend({
  name: 'Popout Style',
  description: 'Synchronises custom stylesheets between popout chat and the main window.',

  enable() {
    Events.on('popout:show', this.sync, this);
  },

  disable() {
    Events.off('popout:show', this.sync);
  },

  sync() {
    defer(() => {
      const stylesheets = $('.extplug-style').clone();
      popoutView.$document.find('head').append(stylesheets);
    });
  },
});

export default PopoutStylePlugin;
