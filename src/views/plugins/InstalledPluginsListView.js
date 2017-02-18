import InstalledPlugin from './InstalledPlugin';
import BasePluginsListView from './BasePluginsListView';

const InstalledPluginsListView = BasePluginsListView.extend({
  view: InstalledPlugin,

  onAdd(plugin) {
    const view = this._super(plugin);

    view.on('resize', this.onResize, this);

    return view;
  },

  onRemove(plugin) {
    const view = this._super(plugin);

    if (view) {
      view.off('resize', this.onResize, this);
      return view;
    }

    return null;
  },
});

export default InstalledPluginsListView;
