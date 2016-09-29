import { extend } from 'underscore';
import $ from 'jquery';
import { View } from 'backbone';

const props = {
  className: 'extplug control-group',
};

export default class ControlGroupView extends View {
  controls = [];

  render() {
    const switchAt = Math.ceil((this.controls.length / 2) - 1);
    let current = $('<div />').addClass('left').appendTo(this.$el);
    this.controls.forEach((item, i) => {
      current.append(item.$el);
      item.render();
      if (i === switchAt) {
        current = $('<div />').addClass('right').appendTo(this.$el);
      }
    });
    return this;
  }

  addControl(control) {
    this.controls.push(control);
    return this;
  }
}

extend(ControlGroupView.prototype, props);
