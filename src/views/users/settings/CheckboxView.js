import Backbone from 'backbone';
import bel from 'nanohtml';
import Events from 'plug/core/Events';

/**
 * A checkbox setting item.
 */
const CheckboxView = Backbone.View.extend({
  className: 'extp-Control extp-Checkbox',
  initialize(o) {
    this.label = o.label;
    this.description = o.description;
    this.enabled = o.enabled || false;
    this.onChange = this.onChange.bind(this);
  },
  render() {
    this.$el
      .append(bel`<i class="extp-Checkbox-icon icon icon-check-blue" />`)
      .append(bel`<span class="extp-Checkbox-label">${this.label}</span>`);

    if (this.description) {
      this.$el
        .on('mouseenter', () =>
          Events.trigger('tooltip:show', this.description, this.$el))
        .on('mouseleave', () => Events.trigger('tooltip:hide'));
    }

    if (this.enabled) {
      this.$el.addClass('is-selected');
    }

    this.$el.on('click', this.onChange);
    return this;
  },
  onChange() {
    const { enabled } = this;
    this.$el.toggleClass('is-selected');
    this.enabled = this.$el.hasClass('is-selected');
    if (enabled !== this.enabled) {
      this.trigger('change', this.enabled);
    }
  },
});

export default CheckboxView;
