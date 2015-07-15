define(function (require, exports, module) {

  const Events = require('plug/core/Events');
  const ShowDialogEvent = require('plug/events/ShowDialogEvent');
  const InstallPluginDialog = require('../../../dialogs/InstallPluginDialog');
  const GroupFooterView = require('./GroupFooterView');

  const PluginsFooterView = GroupFooterView.extend({
    render() {
      this._super();
      this.$install = $('<button />').text('Install Plugin');
      this.$manage = $('<button />').text('Manage');

      this.$install.on('click', () => {
        Events.dispatch(new ShowDialogEvent(
          ShowDialogEvent.SHOW,
          new InstallPluginDialog()
        ));
      });
      this.$manage.on('click', () => this.trigger('manage'));

      this.$left.append(this.$install);
      this.$right.append(this.$manage);
      return this;
    },

    remove() {
      this.$install.off();
      this.$manage.off();
    }
  });

  module.exports = PluginsFooterView;

});
