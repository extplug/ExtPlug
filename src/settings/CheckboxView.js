define('extplug/settings/CheckboxView', function (require, exports, module) {

  var Backbone = require('backbone'),
    $ = require('jquery');

  /**
   * A checkbox setting item.
   */
  var CheckboxView = Backbone.View.extend({
    className: 'item',
    initialize: function (o) {
      this.name = o.name;
      this.label = o.label;
      this.enabled = o.enabled || false;
      this.onChange = this.onChange.bind(this);
    },
    render: function () {
      this.$el
        .append('<i class="icon icon-check-blue" />')
        .append($('<span />').text(this.label));

      if (this.enabled) {
        this.$el.addClass('selected');
      }

      this.$el.on('click', this.onChange);
      return this;
    },
    onChange: function () {
      this.$el.toggleClass('selected');
      var enabled = this.enabled;
      this.enabled = this.$el.hasClass('selected');
      if (enabled !== this.enabled) {
        this.trigger('change', this.getValue());
      }
    },
    getValue: function () {
      return this.enabled;
    },
    setValue: function (enabled) {
      this.enabled = enabled;
      if (enabled) {
        this.$el.addClass('selected');
      }
      else {
        this.$el.removeClass('selected');
      }
    }
  });

  module.exports = CheckboxView;

});
