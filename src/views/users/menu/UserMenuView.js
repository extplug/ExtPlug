import { around } from 'meld';
import BaseView from 'plug/views/users/menu/UserMenuView';
import html from 'bel';

export default BaseView.extend({
  render() {
    this._super();

    this.$el.append(html`
      <div class="item extplug-plugins" data-value="extplug-plugins"
           onclick=${this.onPluginsClick.bind(this)}>
        <i class="icon icon-extplug-plugins"></i>
        <span class="label">Plugins</span>
      </div>
    `);

    return this;
  },

  onPluginsClick() {
    // Prevent firing the change:section event for this change.
    const advice = around(this, 'trigger', () => {});
    this.select('extplug-plugins');
    advice.remove();
    this.trigger('extplug:plugins');
  },
});
