define(function (require, exports, module) {

  var Backbone = require('backbone'),
    $ = require('jquery');

  /**
   * A checkbox setting item.
   */
  var ErrorCheckboxView = Backbone.View.extend({
    className: 'item',
    initialize: function (o) {
      this.name = o.name;
      this.label = o.label;
    },
    render: function () {
      this.$el
        .append('<i class="icon icon-chat-system" />')
        .append($('<span />').css({ color: '#c42e3b' }).text(this.label));

      if (this.enabled) {
        this.$el.addClass('selected');
      }

      return this;
    },
    getValue: function () {
      return false;
    },
    setValue: function (enabled) {
      // nothing
    }
  });

  module.exports = ErrorCheckboxView;

});
