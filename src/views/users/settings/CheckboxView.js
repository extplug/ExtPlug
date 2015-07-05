define(function (require, exports, module) {

  const Backbone = require('backbone');
  const $ = require('jquery');
  const Events = require('plug/core/Events');

  /**
   * A checkbox setting item.
   */
  const CheckboxView = Backbone.View.extend({
    className: 'item',
    initialize(o) {
      this.label = o.label;
      this.description = o.description;
      this.enabled = o.enabled || false;
      this.onChange = this.onChange.bind(this);
    },
    render() {
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
    onChange() {
      this.$el.toggleClass('selected');
      var enabled = this.enabled;
      this.enabled = this.$el.hasClass('selected');
      if (enabled !== this.enabled) {
        this.trigger('change', this.enabled);
      }
    }
  });

  module.exports = CheckboxView;

});
