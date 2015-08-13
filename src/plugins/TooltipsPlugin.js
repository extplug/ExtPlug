define(function (require, exports, module) {

  const Plugin = require('../Plugin');
  const Events = require('plug/core/Events');
  const $ = require('jquery');

  const TooltipsPlugin = Plugin.extend({
    name: 'Tooltips',
    description: 'Provides super easy tooltips using data attributes.',

    enable() {
      this._doc = $(document)
        .on('mouseenter.extplug.core.tooltips', '[data-tooltip]', this.onEnter)
        .on('mouseleave.extplug.core.tooltips', '[data-tooltip]', this.onLeave);
    },

    disable() {
      this._doc.off('.extplug.tooltips');
    },

    onEnter(e) {
      let target = $(e.target).closest('[data-tooltip]');
      let dir = target.attr('data-tooltip-dir');
      let alignLeft = dir && dir.toLowerCase() === 'left';
      Events.trigger('tooltip:show', target.attr('data-tooltip'), target, alignLeft);
    },
    onLeave(e) {
      Events.trigger('tooltip:hide');
    },

  });

  module.exports = TooltipsPlugin;

});
