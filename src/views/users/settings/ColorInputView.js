import InputView from './InputView';
import onecolor from 'onecolor';

const ColorInputView = InputView.extend({
  className: 'item extplug-input extplug-color-input',

  initialize(o) {
    this._super(o);
    this.onUpdate = this.onUpdate.bind(this);
  },

  render() {
    this._super();
    this.$color = $('<div />')
      .addClass('extplug-color-swatch');
    this.$wrapper.append(this.$color);

    this.onUpdate();
    this.on('change', this.onUpdate);
    this.$input.on('keyup', this.onUpdate);

    return this;
  },

  color() {
    try {
      let c = onecolor(this.$input.val());
      if (c) return c;
    }
    catch (e) {}
  },

  onUpdate() {
    let color = this.color();
    if (color) {
      this.$color.css({ 'background-color': color.css() });
      this.$wrapper.removeClass('error');
    }
    else {
      this.$wrapper.addClass('error');
    }
  },

  value() {
    let color = this.color();
    return color ? this.$input.val() : '';
  }
});

export default ColorInputView;
