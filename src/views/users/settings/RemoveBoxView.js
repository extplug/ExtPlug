import { View } from 'backbone';
import $ from 'jquery';
import Events from 'plug/core/Events';
import ConfirmDialog from 'plug/views/dialogs/ConfirmDialog';
import ShowDialogEvent from 'plug/events/ShowDialogEvent';

/**
 * A checkbox setting item.
 */
export default class RemoveBoxView extends View {
  className = 'item selected';

  render() {
    this.$icon = $('<i />').addClass('icon icon-delete');
    this.$el
      .append(this.$icon)
      .append($('<span />').text(this.model.get('name')));

    this.$el.css('cursor', 'default');
    this.$icon.css('cursor', 'pointer')
              .css({ top: '-6px', left: '-4px' });

    this.$icon.on('click', this.onRemove);
    return this;
  }

  onRemove = () => {
    Events.dispatch(new ShowDialogEvent(
      ShowDialogEvent.SHOW,
      new ConfirmDialog({
        title: 'Remove Plugin',
        message: 'Are you sure you want to uninstall this plugin?',
        action: () => {
          window.extp.uninstall(this.model.get('id'));
        },
      })
    ));
  }
}
