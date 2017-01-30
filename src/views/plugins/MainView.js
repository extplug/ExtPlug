import TabbedPanelView from 'plug/views/users/TabbedPanelView';
import Style from '../../util/Style';
import TabView from './TabView';
import PluginsView from './PluginsView';

import styleSearchBar from './SearchBar.css';
import stylePluginRow from './PluginRow.css';
import styleMainView from './MainView.css';
import stylePluginsView from './PluginsView.css';
import stylePackageInfoDialog from './PackageInfoDialog.css';

const MainView = TabbedPanelView.extend({
  className: 'user-content extplug-plugins ExtPlugSettingsView',
  defaultTab: 'plugins',
  getMenu: () => new TabView(),

  render() {
    this.style = new Style();
    this.style.raw(styleSearchBar);
    this.style.raw(styleMainView);
    this.style.raw(stylePluginRow);
    this.style.raw(stylePluginsView);
    this.style.raw(stylePackageInfoDialog);

    return this._super();
  },

  remove() {
    this.style.remove();
    return this._super();
  },

  getView(section) {
    if (section === 'plugins') {
      return new PluginsView();
    }
    return null;
  },
});

export default MainView;
