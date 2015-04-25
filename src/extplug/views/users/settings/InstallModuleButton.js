define(function (require, exports, module) {

  const { View } = require('backbone');
  const InstallModuleDialog = require('../../dialogs/InstallModuleDialog');
  const ShowDialogEvent = require('plug/events/ShowDialogEvent');
  const Events = require('plug/core/Events');

  module.exports = View.extend({
    tagName: 'button',
    events: {
      'click': 'onClick'
    },
    initialize() {
    },
    render() {
      this.$el.css({ top: 'auto' });
      this.$el.text('Install Module');
    },

    onClick() {
      Events.dispatch(new ShowDialogEvent(ShowDialogEvent.SHOW,
                                          new InstallModuleDialog()));
    }
  });

});
