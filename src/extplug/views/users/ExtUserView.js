define(function (require, exports, module) {

  var UserView = require('plug/views/users/UserView');

  return UserView.extend({
    className: 'extplug app-left',
    show: function (category, sub, _arg2) {
      this._super(category, sub, _arg2);

      if (category === 'settings' && sub === 'ext-plug') {
        this.view.menu.selectExtPlug();
      }
    }
  });

});