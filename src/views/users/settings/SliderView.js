import Backbone from 'backbone';
import $ from 'jquery';
import { defer, extend } from 'underscore';

function template(o) {
  return `
    <span class="title">${o.label}</span>
    <span class="value"></span>
    <div class="counts">
      <span class="count">${o.min}</span>
      <span class="count">${o.max}</span>
      <span class="stretch"></span>
    </div>
    <div class="slider">
      <div class="bar"></div>
      <div class="circle"></div>
      <div class="hit"></div>
    </div>
  `;
}

const props = {
  className: 'extplug-slider cap',
};

export default class SliderView extends Backbone.View {
  constructor(options) {
    super(options);

    this.onStart = this.onStart.bind(this);
    this.onMove = this.onMove.bind(this);
    this.onStop = this.onStop.bind(this);
    this.value = this.options.value || this.options.min;
  }

  render() {
    this.$el.append(template(this.options));
    this.$bar = this.$('.bar');
    this.$hit = this.$('.hit').on('mousedown', this.onStart);
    this.$circle = this.$('.circle');
    this.$value = this.$('.value');
    defer(() => {
      this.setValue(this.value, true);
    });
    return this;
  }

  onStart = () => {
    $(document)
      .on('mousemove', this.onMove)
      .on('mouseup', this.onStop);
  }

  onMove = (e) => {
    const offset = (e.pageX - this.$hit.offset().left);
    const percent = Math.max(0, Math.min(1, offset / (this.$hit.width() - this.$circle.width())));
    const value = Math.round(this.options.min + (percent * (this.options.max - this.options.min)));
    this.setValue(Math.max(this.options.min, value));
    e.preventDefault();
    e.stopPropagation();
  }

  onStop = () => {
    $(document)
      .off('mousemove', this.onMove)
      .off('mouseup', this.onStop);
  }

  setValue(value, force) {
    if (value !== this.value || force) {
      const percent = (value - this.options.min) / (this.options.max - this.options.min);
      const circleCenter = this.$circle.width() / 2;
      const position = (this.$hit.width() - this.$circle.width()) * percent;
      const baseOffset = parseInt(this.$hit.css('left'), 10);
      this.$circle.css('left', baseOffset + (position - circleCenter));
      this.$value.text(value);
      this.trigger('change', value);
      this.value = value;
    }
  }
}

extend(SliderView.prototype, props);
