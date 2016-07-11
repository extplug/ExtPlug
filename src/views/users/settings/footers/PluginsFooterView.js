import $ from 'jquery';
import Events from 'plug/core/Events';
import ShowDialogEvent from 'plug/events/ShowDialogEvent';
import InstallPluginDialog from '../../../dialogs/InstallPluginDialog';
import GroupFooterView from './GroupFooterView';

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
  },
});

export default PluginsFooterView;
