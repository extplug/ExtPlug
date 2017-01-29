import OriginalMenuView from 'plug/views/users/menu/UserMenuView';
import Plugin from '../Plugin';
import OverrideMenuView from '../views/users/menu/UserMenuView';
import PluginsView from '../views/plugins/PluginsView';

/**
 * Plugin to add the ExtPlug menu item to the user menu.
 */

export default Plugin.extend({
  name: 'ExtPlug Item in User Menu',
  description: 'Adds the ExtPlug Plugins entry to the User Menu.',

  /**
   * Get the current user view instance.
   */
  getUserView() {
    return this.ext.appView.user;
  },

  /**
   * Check if a UserMenuView is already rendered.
   */
  isRendered() {
    return this.getUserView().$el.find('#user-menu').length > 0;
  },

  updated() {
    const userView = this.getUserView();
    userView.$el.prepend(userView.menu.$el);
    userView.menu.render();
    userView.menu.on('change:section', userView.change, userView);
  },

  /**
   * Switch to the plugins settings section.
   */
  onPluginsSection() {
    const userView = this.getUserView();
    userView.clear();
    userView.section = 'extplug-plugins';
    userView.view = new PluginsView();
    userView.$el.append(userView.view.$el);
    userView.view.render();
  },

  /**
   * Replace plug.dj's user menu view with ExtPlug's extended version.
   */
  enable() {
    const userView = this.getUserView();

    const originalMenu = userView.menu;
    if (originalMenu) {
      originalMenu.off();
    }

    userView.menu = new OverrideMenuView();
    if (this.isRendered()) {
      originalMenu.remove();
      this.updated();
      userView.menu.on('extplug:plugins', this.onPluginsSection, this);
    }
  },

  /**
   * Revert back to plug.dj's own user menu view.
   */
  disable() {
    const userView = this.getUserView();

    const newMenu = userView.menu;
    if (newMenu) {
      newMenu.off();
    }

    userView.menu = new OriginalMenuView();
    if (this.isRendered()) {
      newMenu.remove();
      this.updated();
    }
  },
});
