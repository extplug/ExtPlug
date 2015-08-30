import { View } from 'backbone';
import $ from 'jquery';
import Events from 'plug/core/Events';
import ConfirmDialog from 'plug/views/dialogs/ConfirmDialog';
import ShowDialogEvent from 'plug/events/ShowDialogEvent';

/**
 * A checkbox setting item.
 */
const RemoveBoxView = View.extend({
  className: 'item selected',
  initialize() {
    this.onRemove = this.onRemove.bind(this);
  },
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
  },
  onRemove() {
    Events.dispatch(new ShowDialogEvent(
      ShowDialogEvent.SHOW,
      new ConfirmDialog({
        title: 'Remove Plugin',
        message: 'Are you sure you want to uninstall this plugin?',
        action: () => {
          extp.uninstall(this.model.get('id'));
        }
      })
    ));
  }
});

export default RemoveBoxView;
