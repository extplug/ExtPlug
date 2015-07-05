define(function (require, exports, module) {

  const $ = require('jquery');
  const { View } = require('backbone');

  const ControlGroupView = View.extend({
    className: 'extplug control-group',

    initialize(o) {
      this.name = o.name;
      this.controls = [];
    },

    render() {
      this.$el.append($('<div>').addClass('header').append($('<span>').text(this.name)));

      let switchAt = Math.ceil(this.controls.length / 2 - 1);
      let current = $('<div />').addClass('left').appendTo(this.$el);
      this.controls.forEach((item, i) => {
        current.append(item.$el);
        item.render();
        if (i === switchAt) {
          current = $('<div />').addClass('right').appendTo(this.$el);
        }
      });
      return this;
    },

    add(control) {
      this.controls.push(control);
      return this;
    }
  });

  module.exports = ControlGroupView;

});
