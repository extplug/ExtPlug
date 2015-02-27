define('extplug/settings/CheckboxView', function (require, exports, module) {

  var Backbone = require('backbone'),
    $ = require('jquery'),
    Events = require('plug/core/Events');

  /**
   * A checkbox setting item.
   */
  var CheckboxView = Backbone.View.extend({
    className: 'item',
    initialize: function (o) {
      this.label = o.label;
      this.description = o.description;
      this.enabled = o.enabled || false;
      this.onChange = this.onChange.bind(this);
    },
    render: function () {
      this.$el
        .append('<i class="icon icon-check-blue" />')
        .append($('<span />').text(this.label));

      if (this.description) {
        this.$el
          .on('mouseenter', function () {
            Events.trigger('tooltip:show', this.description, this.$el);
          }.bind(this))
          .on('mouseleave', function () { Events.trigger('tooltip:hide'); });
      }

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
