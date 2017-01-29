import TabbedPanelView from 'plug/views/users/TabbedPanelView';
import Style from '../../util/Style';
import TabView from './TabView';
import PluginsView from './PluginsView';
import style from './style.css';

const MainView = TabbedPanelView.extend({
  className: 'user-content extplug-plugins ExtPlugSettingsView',
  defaultTab: 'plugins',
  getMenu: () => new TabView(),

  render() {
    this.style = new Style();
    this.style.raw(style);
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
