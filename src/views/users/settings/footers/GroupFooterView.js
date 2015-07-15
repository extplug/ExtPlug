define(function (require, exports, module) {

  const { View } = require('backbone');

  const GroupFooterView = View.extend({
    className: 'extplug-group-footer',

    render() {
      this.$left = $('<div />').addClass('left');
      this.$right = $('<div />').addClass('right');
      this.$el.append(this.$left, this.$right);

      return this._super();
    }
  });

  module.exports = GroupFooterView;

});
