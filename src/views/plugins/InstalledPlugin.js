import Backbone from 'backbone';
import bel from 'bel';
import Lang from 'lang/Lang';

export default Backbone.View.extend({
  className: 'PluginRow PluginRow--noFlex',

  render() {
    const model = this.model.toJSON();
    const hasSettings = this.getPluginSettingsView() !== null;

    this.$el.append(bel`
      <div class="PluginRow-meta">
        <div class="PluginRow-name">
          <span>${model.name}</span>
        </div>
        <div class="PluginRow-description">
          ${model.description}
        </div>
      </div>
    `);
    if (hasSettings) {
      this.$el.append(bel`
        <button class="PluginRow-expand"
          onclick=${() => this.toggleSettings()}
          data-tooltip=${Lang.userMenu.settings}>
          <i class="PluginRow-expandIcon icon icon-settings-white"></i>
        </button>
      `);
    }

    this.$el.append(bel`
      <div class="PluginRow-settings" />
    `, bel`
      <div class="clearfix" />
    `);

    if (hasSettings) {
      this.$expand = this.$('.PluginRow-expand');
      this.$expandIcon = this.$('.PluginRow-expandIcon');
    }
    this.$settings = this.$('.PluginRow-settings');
  },

  expandSettings() {
    this.$settings.addClass('is-expanded');
    this.$expandIcon.removeClass('icon-settings-white').addClass('icon-arrow-up');

    this.settingsView = this.getPluginSettingsView();
    this.$settings.append(this.settingsView.$el);

    this.settingsView.render();
  },

  collapseSettings() {
    this.$settings.removeClass('is-expanded');
    this.$expandIcon.removeClass('icon-arrow-up').addClass('icon-settings-white');

    this.settingsView.remove();
    this.settingsView = null;

    this.$settings.empty();
  },

  toggleSettings() {
    if (this.$settings.hasClass('is-expanded')) {
      this.collapseSettings();
    } else {
      this.expandSettings();
    }

    this.trigger('resize');
  },

  getPluginSettingsView() {
    const plugin = this.model.get('instance');
    if (!plugin._settings) { // eslint-disable-line no-underscore-dangle
      return null;
    }

    return plugin.getSettingsView();
  },
});
