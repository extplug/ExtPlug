import Backbone from 'backbone';

const PluginsView = Backbone.View.extend({
  className: 'user-content extplug-plugins',
  render() {
    this.$el.append(`
      <h1>ExtPlug Plugins</h1>
      <p>
        Plugin search and management will be here soon.
      </p>
    `);
  },
});

export default PluginsView;
