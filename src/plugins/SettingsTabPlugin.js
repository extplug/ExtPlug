import { around, after } from 'meld';
import Events from 'plug/core/Events';
import UserView from 'plug/views/users/UserView';
import UserSettingsView from 'plug/views/users/settings/SettingsView';
import Plugin from '../Plugin';
import TabMenuView from '../views/users/settings/TabMenuView';
import SettingsSectionView from '../views/users/settings/SettingsView';

const SettingsTabPlugin = Plugin.extend({
  enable() {
    const userView = this.ext.appView.user;
    Events.off('show:user', userView.show);
    this.userPaneAdvice = after(UserView.prototype, 'show', (category, sub) => {
      if (category === 'settings' && sub === 'ext-plug') {
        this.view.menu.select(sub);
      }
    });
    Events.on('show:user', userView.show, userView);

    // Add ExtPlug tab to user settings
    this.settingsTabAdvice = around(UserSettingsView.prototype, 'getMenu',
      () => new TabMenuView());
    this.settingsPaneAdvice = around(UserSettingsView.prototype, 'getView', joinpoint => {
      if (joinpoint.args[0] === 'ext-plug') {
        return new SettingsSectionView({
          plugins: this.ext.plugins,
          ext: this.ext,
        });
      }
      return joinpoint.proceed();
    });
  },

  disable() {
    this.settingsTabAdvice.remove();
    this.settingsPaneAdvice.remove();
    const userView = this.ext.appView.user;
    Events.off('show:user', userView.show);
    this.userPaneAdvice.remove();
    Events.on('show:user', userView.show, userView);
  },
});

export default SettingsTabPlugin;
