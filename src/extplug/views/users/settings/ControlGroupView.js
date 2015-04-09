define('extplug/views/users/settings/ControlGroupView', function (require, exports, module) {

  var $ = require('jquery'),
    BaseView = require('extplug/views/BaseView'),
    Style = require('extplug/util/Style');

  var ControlGroupView = BaseView.extend({
    className: 'extplug control-group',

    initialize: function (o) {
      this.name = o.name;
      this.controls = [];
    },

    render: function () {
      this.$el.append($('<div>').addClass('header').append($('<span>').text(this.name)));

      var $el = this.$el,
        switchAt = Math.ceil(this.controls.length / 2 - 1),
        current = $('<div />').addClass('left').appendTo($el);
      this.controls.forEach(function (item, i) {
        current.append(item.$el);
        item.render();
        if (i === switchAt) {
          current = $('<div />').addClass('right').appendTo($el);
        }
      });
      return this;
    },

    add: function (control) {
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
