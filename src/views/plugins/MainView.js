import TabbedPanelView from 'plug/views/users/TabbedPanelView';
import TabView from './TabView';
import PluginsSearchView from './PluginsView';
import InstalledPluginsView from './InstalledPluginsView';

const MainView = TabbedPanelView.extend({
  className: 'user-content extplug-plugins ExtPlugSettingsView',
  defaultTab: 'plugins',
  getMenu: () => new TabView(),

  getView(section) {
    if (section === 'discover-plugins') {
      return new PluginsSearchView();
    }
    if (section === 'plugins') {
      return new InstalledPluginsView();
    }
    return null;
  },
});

export default MainView;
