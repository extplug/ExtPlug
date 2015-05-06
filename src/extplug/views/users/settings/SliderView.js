define(function (require, exports, module) {
  const Backbone = require('backbone');
  const $ = require('jquery');
  const Style = require('extplug/util/Style');

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

  const SliderView = Backbone.View.extend({
    className: 'extplug-slider cap',
    initialize() {
      this.onStart = this.onStart.bind(this);
      this.onMove = this.onMove.bind(this);
      this.onStop = this.onStop.bind(this);
      this._value = this.options.value || this.options.min;
    },
    render() {
      this.$el.append(template(this.options));
      this.$bar = this.$('.bar');
      this.$hit = this.$('.hit').on('mousedown', this.onStart);
      this.$circle = this.$('.circle');
      this.$value = this.$('.value');
      _.delay(function () {
        this.setValue(this._value, true);
      }.bind(this));
      return this;
    },
    onStart() {
      $(document)
        .on('mousemove', this.onMove)
        .on('mouseup', this.onStop);
    },
    onMove(e) {
      let offset = (e.pageX - this.$hit.offset().left);
      let percent = Math.max(0, Math.min(1, offset / (this.$hit.width() - this.$circle.width())));
      let value = Math.round(this.options.min + percent * (this.options.max - this.options.min));
      this.setValue(Math.max(this.options.min, value));
      e.preventDefault();
      e.stopPropagation();
    },
    onStop() {
      $(document)
        .off('mousemove', this.onMove)
        .off('mouseup', this.onStop);
    },
    getValue() { return this._value; },
    setValue(value, force) {
      if (value !== this._value || force) {
        let percent = (value - this.options.min) / (this.options.max - this.options.min);
        this.$circle.css('left', parseInt(this.$hit.css('left'), 10) +
                                 (this.$hit.width() - this.$circle.width()) * percent -
                                 this.$circle.width() / 2);
        this.$value.text(value);
        this.trigger('change', value);
        this._value = value;
      }
    }
  });

  SliderView._style = new Style({
    '.extplug-slider': {
      '.counts .count:nth-child(2)': {
        'float': 'right'
      }
    }
  });

  module.exports = SliderView;

});
