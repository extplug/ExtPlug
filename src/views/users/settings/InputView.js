import Events from 'plug/core/Events';
import { View } from 'backbone';
import { extend, omit } from 'underscore';
import $ from 'jquery';

const KEY_ENTER = 13;

const props = {
  className: 'item extplug-input',
};

export default class InputView extends View {
  constructor(options) {
    super(options);

    this.label = options.label;
    this.description = options.description;
    this.value = options.value;

    options.type = options.type || 'text';
    this.attributes = omit(options, 'label', 'value', 'description');
  }

  render() {
    this.$label = $('<label />').addClass('title').text(this.label);
    this.$input = $('<input />').attr(this.attributes).val(this.value);
    this.$wrapper = $('<div />').addClass('extplug-input-wrap');
    this.$el.append(this.$label, this.$wrapper.append(this.$input));
    if (this.description) {
      this.$label
        .on('mouseenter', () => {
          Events.trigger('tooltip:show', this.description, this.$el);
        })
        .on('mouseleave', () => {
          Events.trigger('tooltip:hide');
        });
    }

    this.$input.on('keyup', this.onKeyUp);
    this.$input.on('keydown', this.onKeyDown);
    this.$input.on('focus', this.onFocus);
    this.$input.on('blur', this.onBlur);

    this.$el.on('mousedown', this.focus);
  }

  onKeyUp = () => {
  }

  onKeyDown = (e) => {
    if (e.keyCode === KEY_ENTER) {
      this.onBlur();
    }
  }

  focus = () => {
    this.$input.focus();
  }

  onFocus = () => {
    this.$wrapper.addClass('focused');
  }
  onBlur = () => {
    this.$wrapper.removeClass('focused');
    this.trigger('change', this.$input.val());
  }
}

extend(InputView.prototype, props);
