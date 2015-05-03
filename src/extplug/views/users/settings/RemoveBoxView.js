define(function (require, exports, module) {

  const { View } = require('backbone');
  const $ = require('jquery');
  const Events = require('plug/core/Events');
  const ConfirmDialog = require('plug/views/dialogs/ConfirmDialog');
  const ShowDialogEvent = require('plug/events/ShowDialogEvent');

  /**
   * A checkbox setting item.
   */
  var RemoveBoxView = View.extend({
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

  module.exports = RemoveBoxView;

});
