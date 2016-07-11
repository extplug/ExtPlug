import $ from 'jquery';
import Events from 'plug/core/Events';
import Plugin from '../Plugin';

const TooltipsPlugin = Plugin.extend({
  name: 'Tooltips',
  description: 'Provides super easy tooltips using data attributes.',

  enable() {
    this.document = $(document)
      .on('mouseenter.extplug.core.tooltips', '[data-tooltip]', this.onEnter)
      .on('mouseleave.extplug.core.tooltips', '[data-tooltip]', this.onLeave);
  },

  disable() {
    this.document.off('.extplug.tooltips');
  },

  onEnter(e) {
    const target = $(e.target).closest('[data-tooltip]');
    const dir = target.attr('data-tooltip-dir');
    const alignLeft = dir && dir.toLowerCase() === 'left';
    Events.trigger('tooltip:show', target.attr('data-tooltip'), target, alignLeft);
  },
  onLeave() {
    Events.trigger('tooltip:hide');
  },

});

export default TooltipsPlugin;
