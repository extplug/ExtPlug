import Backbone from 'backbone';

const PluginsView = Backbone.View.extend({
  render() {
    this.$el.append(`
      <h1>ExtPlug Plugins</h1>
      <p>
        Plugin search and management will be here soon.
      </p>
    `);

    return this;
  },
  onResize() {},
});

export default PluginsView;
