define(function (require, exports, module) {

  const Backbone = require('backbone');
  const $ = require('jquery');

  /**
   * A checkbox setting item.
   */
  const ErrorCheckboxView = Backbone.View.extend({
    className: 'item',
    initialize(o) {
      this.name = o.name;
      this.label = o.label;
    },
    render() {
      this.$el
        .append('<i class="icon icon-chat-system" />')
        .append($('<span />').css({ color: '#c42e3b' }).text(this.label));

      if (this.enabled) {
        this.$el.addClass('selected');
      }

      return this;
    },
    getValue() {
      return false;
    },
    setValue(enabled) {
      // nothing
    }
  });

  module.exports = ErrorCheckboxView;

});
