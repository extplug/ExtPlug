define(function (require, exports, module) {

  const Events = require('plug/core/Events');
  const ShowDialogEvent = require('plug/events/ShowDialogEvent');
  const Style = require('../../../util/Style');
  const InstallPluginDialog = require('../../dialogs/InstallPluginDialog');
  const FooterView = require('./GroupFooterView');
  const ControlGroupView = require('./ControlGroupView');

  const PluginsFooterView = FooterView.extend({
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
      this.$manage.on('click', () => {
        Events.trigger('extplug:plugins:manage');
      });

      this.$left.append(this.$install);
      this.$right.append(this.$manage);
      return this;
    },

    remove() {
      this.$install.off();
      this.$manage.off();
    }
  });

  const PluginsGroupView = ControlGroupView.extend({
    render() {
      this._super();
      this.footer = new PluginsFooterView();
      this.footer.render();
      this.$el.append(this.footer.$el);
      return this;
    }
  });

  module.exports = PluginsGroupView;

});
