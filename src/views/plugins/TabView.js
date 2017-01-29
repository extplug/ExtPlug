import $ from 'jquery';
import Backbone from 'backbone';

export default Backbone.View.extend({
  className: 'extplug-tab-menu ExtPlugSettingsView-tabs',

  render() {
    this.$el.append(`
      <button class="plugins" data-value="plugins">Plugins</button>
      <button class="settings" data-value="settings">ExtPlug Settings</button>
    `);

    this.$('button').on('click', this.onClick.bind(this));

    return this;
  },

  onClick(event) {
    const target = $(event.target);
    this.select(target.data('value'));
  },

  select(section) {
    this.$('button').removeClass('selected');
    this.$(`button.${section}`).addClass('selected');
    this.trigger('select', section);
  },

  remove() {
    this.$('button').off();
    this._super();
  },
});
