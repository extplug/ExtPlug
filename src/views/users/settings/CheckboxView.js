import { extend } from 'underscore';
import Backbone from 'backbone';
import $ from 'jquery';
import Events from 'plug/core/Events';

const props = {
  className: 'item',
};

/**
 * A checkbox setting item.
 */
export default class CheckboxView extends Backbone.View {
  constructor(options) {
    super(options);

    this.label = options.label;
    this.description = options.description;
    this.enabled = options.enabled || false;
    this.onChange = this.onChange.bind(this);
  }

  render() {
    this.$el
      .append('<i class="icon icon-check-blue" />')
      .append($('<span />').text(this.label));

    if (this.description) {
      this.$el
        .on('mouseenter', () => {
          Events.trigger('tooltip:show', this.description, this.$el);
        })
        .on('mouseleave', () => {
          Events.trigger('tooltip:hide');
        });
    }

    if (this.enabled) {
      this.$el.addClass('selected');
    }

    this.$el.on('click', this.onChange);
    return this;
  }

  onChange() {
    this.$el.toggleClass('selected');
    const enabled = this.enabled;
    this.enabled = this.$el.hasClass('selected');
    if (enabled !== this.enabled) {
      this.trigger('change', this.enabled);
    }
  }
}

extend(CheckboxView.prototype, props);
