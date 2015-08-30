import Events from 'plug/core/Events';
import { View } from 'backbone';
import { omit } from 'underscore';
import $ from 'jquery';

const KEY_ENTER = 13;

const InputView = View.extend({
  className: 'item extplug-input',

  initialize(o) {
    this.label = o.label;
    this.description = o.description;
    this.value = o.value;

    o.type = o.type || 'text';
    this.attributes = omit(o, 'label', 'value', 'description');

    this.onKeyUp = this.onKeyUp.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onFocus = this.onFocus.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.focus = this.focus.bind(this);
  },

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
        .on('mouseleave', () => { Events.trigger('tooltip:hide'); });
    }

    this.$input.on('keyup', this.onKeyUp);
    this.$input.on('keydown', this.onKeyDown);
    this.$input.on('focus', this.onFocus);
    this.$input.on('blur', this.onBlur);

    this.$el.on('mousedown', this.focus);
  },

  onKeyUp() {
  },

  onKeyDown(e) {
    if (e.keyCode === KEY_ENTER) {
      this.onBlur();
    }
  },

  focus() {
    this.$input.focus();
  },

  onFocus() {
    this.$wrapper.addClass('focused');
  },
  onBlur() {
    this.$wrapper.removeClass('focused');
    this.trigger('change', this.$input.val());
  }
});

export default InputView;
