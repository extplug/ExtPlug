define(function (require, exports, module) {

  const { View } = require('backbone');
  const Style = require('extplug/util/Style');

  const GroupFooterView = View.extend({
    className: 'extplug-group-footer',

    render() {
      this.$left = $('<div />').addClass('left');
      this.$right = $('<div />').addClass('right');
      this.$el.append(this.$left, this.$right);

      return this._super();
    }
  });

  GroupFooterView._style = new Style({
    // disgusting specificity hack
    '#user-view #user-settings .extplug-group-footer': {
      'clear': 'both',
      'button': {
        'top': 'auto',
        'position': 'relative'
      }
    }
  });

  module.exports = GroupFooterView;

});