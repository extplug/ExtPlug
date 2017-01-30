import TabbedPanelView from 'plug/views/users/TabbedPanelView';
import TabView from './TabView';
import PluginsView from './PluginsView';

const MainView = TabbedPanelView.extend({
  className: 'user-content extplug-plugins ExtPlugSettingsView',
  defaultTab: 'plugins',
  getMenu: () => new TabView(),

  getView(section) {
    if (section === 'plugins') {
      return new PluginsView();
    }
    return null;
  },
});

export default MainView;
