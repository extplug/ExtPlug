import $ from 'jquery';
import onecolor from 'onecolor';
import InputView from './InputView';

export default class ColorInputView extends InputView {
  className = 'item extplug-input extplug-color-input';

  render() {
    super.render();
    this.$color = $('<div />')
      .addClass('extplug-color-swatch');
    this.$wrapper.append(this.$color);

    this.onUpdate();
    this.on('change', this.onUpdate);
    this.$input.on('keyup', this.onUpdate);

    return this;
  }

  color() {
    try {
      const c = onecolor(this.$input.val());
      if (c) return c;
    } catch (e) {
      // ignore
    }
    return null;
  }

  onUpdate = () => {
    const color = this.color();
    if (color) {
      this.$color.css({ 'background-color': color.css() });
      this.$wrapper.removeClass('error');
    } else {
      this.$wrapper.addClass('error');
    }
  }

  value() {
    const color = this.color();
    return color ? this.$input.val() : '';
  }
}
