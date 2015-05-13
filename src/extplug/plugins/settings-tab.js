define(function (require, exports, module) {

  const { around } = require('meld');
  const UserView = require('plug/views/users/UserView');
  const UserSettingsView = require('plug/views/users/settings/SettingsView');
  const Plugin = require('../Plugin');
  const ExtUserView = require('../views/users/ExtUserView');
  const TabMenuView = require('../views/users/settings/TabMenuView');
  const SettingsSectionView = require('../views/users/settings/SettingsView');

  const SettingsTabPlugin = Plugin.extend({

    enable() {
      // replace rendered UserView
      let userView = new ExtUserView();
      userView.render();
      this.ext.appView.user.$el.replaceWith(userView.$el);
      this.ext.appView.user = userView;

      // Add ExtPlug tab to user settings
      this._settingsTabAdvice = around(UserSettingsView.prototype, 'getMenu', () => {
        return new TabMenuView();
      });
      this._settingsPaneAdvice = around(UserSettingsView.prototype, 'getView', joinpoint => {
        if (joinpoint.args[0] === 'ext-plug') {
          return new SettingsSectionView({
            plugins: this.ext._plugins,
            ext: this.ext
          });
        }
        return joinpoint.proceed();
      });
    },

    disable() {
      this._settingsTabAdvice.remove();
      this._settingsPaneAdvice.remove();
      let userView = new UserView();
      userView.render();
      this.ext.appView.user.$el.replaceWith(userView.$el);
      this.ext.appView.user = userView;
    }

  });

  module.exports = SettingsTabPlugin;

});
