define(function (require, exports, module) {

  const UserView = require('plug/views/users/UserView');

  const ExtUserView = UserView.extend({
    className: 'extplug app-left',
    show(category, sub, _arg2) {
      this._super(category, sub, _arg2);

      if (category === 'settings' && sub === 'ext-plug') {
        this.view.menu.selectExtPlug();
      }
    }
  });

  module.exports = ExtUserView;

});
