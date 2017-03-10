import Backbone from 'backbone';
import html from 'bel';
import Lang from 'lang/Lang';
import Events from 'plug/core/Events';
import PluginInstallationEvent from '../../events/PluginInstallationEvent';

export default Backbone.View.extend({
  className: 'PluginRow',

  initialize() {
    this.listenTo(this.model, 'change', () => {
      this.$el.empty();
      this.render();
    });
    this.isExpanded = false;
  },

  render() {
    const model = this.model.toJSON();
    const hasSettings = this.getPluginSettingsView() !== null;

    const onHoverStatus = () => {
      if (model.enabled) {
        this.$statusText.text('Disable');
      }
    };
    const onBlurStatus = () => {
      if (model.enabled) {
        this.$statusText.text('Enabled');
      }
    };

    this.$el.append(html`
      <div class="PluginRow-flexContent">
        <div class="PluginRow-meta">
          <div class="PluginRow-name">
            <span>${model.name}</span>
          </div>
          <div class="PluginRow-description">
            ${model.description}
          </div>
        </div>
        <div class="PluginRow-buttons">
          <button class="PluginRow-button PluginRow-status ${model.enabled ? 'is-enabled' : ''}"
            onclick=${() => this.toggleStatus()}
            onmouseover=${onHoverStatus}
            onmouseout=${onBlurStatus}>
            <i class="PluginRow-icon icon icon-${model.enabled ? 'check-white' : 'check-purple'}"></i>
            <span class="PluginRow-statusText">${model.enabled ? 'Enabled' : 'Enable'}</span>
          </button>
          <button class="PluginRow-button PluginRow-uninstall"
            onclick=${() => this.uninstall()}>
            <i class="PluginRow-icon icon icon-x-white"></i>
            <span>Uninstall</span>
          </a>
        </div>
        ${hasSettings ? html`
          <button class="PluginRow-expand"
            onclick=${() => this.toggleSettings()}
            data-tooltip=${Lang.userMenu.settings}>
            <i class="PluginRow-expandIcon icon icon-settings-white"></i>
          </button>
        ` : null}
      </div>
    `);

    this.$el.append(html`
      <div class="PluginRow-settings" />
    `, html`
      <div class="clearfix" />
    `);

    if (hasSettings) {
      this.$expand = this.$('.PluginRow-expand');
      this.$expandIcon = this.$('.PluginRow-expandIcon');
    }

    this.$settings = this.$('.PluginRow-settings');
    this.$statusText = this.$('.PluginRow-statusText');

    if (this.isExpanded) {
      this.expandSettings();
    }
  },

  toggleStatus() {
    if (!this.model.get('enabled')) {
      this.model.enable();
    } else {
      this.model.disable();
    }
  },

  uninstall() {
    const name = this.model.get('name');
    const url = this.model.get('fullUrl');
    Events.dispatch(new PluginInstallationEvent(
      PluginInstallationEvent.ASK_UNINSTALL,
      { name, url },
    ));
  },

  expandSettings() {
    this.isExpanded = true;
    this.$settings.addClass('is-expanded');
    this.$expandIcon.removeClass('icon-settings-white').addClass('icon-arrow-up');

    this.settingsView = this.getPluginSettingsView();
    this.$settings.append(this.settingsView.$el);

    this.settingsView.render();
  },

  collapseSettings() {
    this.isExpanded = false;
    this.$settings.removeClass('is-expanded');
    this.$expandIcon.removeClass('icon-arrow-up').addClass('icon-settings-white');

    this.settingsView.remove();
    this.settingsView = null;

    this.$settings.empty();
  },

  toggleSettings() {
    if (this.isExpanded) {
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
