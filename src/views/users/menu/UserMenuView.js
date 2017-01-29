import { around } from 'meld';
import BaseView from 'plug/views/users/menu/UserMenuView';

export default BaseView.extend({
  render() {
    this._super();
    this.$el.append(`
      <div class="item extplug-plugins" data-value="extplug-plugins">
        <i class="icon icon-extplug-plugins" />
        <span class="label">Plugins</span>
      </div>
    `);

    this.$('.extplug-plugins').on('click', this.onPluginsClick.bind(this));
  },

  remove() {
    this.$('.extplug-plugins').off();
    this._super();
  },

  onPluginsClick() {
    // Prevent firing the change:section event for this change.
    const advice = around(this, 'trigger', () => {});
    this.select('extplug-plugins');
    advice.remove();
    this.trigger('extplug:plugins');
  },
});
