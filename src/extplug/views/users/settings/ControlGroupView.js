define(function (require, exports, module) {

  const $ = require('jquery');
  const BaseView = require('extplug/views/BaseView');
  const Style = require('extplug/util/Style');

  const ControlGroupView = BaseView.extend({
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

  ControlGroupView._style = new Style({
    '.extplug.control-group:not(:first-child) .header': {
      'margin': '35px 0 8px 0 !important'
    }
  });

  module.exports = ControlGroupView;

});
