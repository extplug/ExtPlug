define(function (require, exports, module) {

  const { View } = require('backbone');
  const { omit } = require('underscore');
  const $ = require('jquery');

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
      this.onBlur = this.onBlur.bind(this);
    },

    render() {
      this.$label = $('<label />').addClass('title').text(this.label);
      this.$input = $('<input />').attr(this.attributes).val(this.value);
      this.$el.append(this.$label, this.$input);
      if (this.description) {
        this.$label
          .on('mouseenter', () => {
            Events.trigger('tooltip:show', this.description, this.$el);
          })
          .on('mouseleave', () => { Events.trigger('tooltip:hide'); });
      }

      this.$input.on('keyup', this.onKeyUp);
      this.$input.on('keydown', this.onKeyDown);
      this.$input.on('blur', this.onBlur);
    },

    onKeyUp() {
    },

    onKeyDown(e) {
      if (e.keyCode === KEY_ENTER) {
        this.onBlur();
      }
    },

    onBlur() {
      this.trigger('change', this.$input.val());
    }

  });

  module.exports = InputView;

});
