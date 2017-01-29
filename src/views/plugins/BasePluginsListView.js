import Backbone from 'backbone';

export default Backbone.View.extend({
  initialize() {
    this.collection.on('reset', this.onReset, this);
    this.collection.on('add', this.onAdd, this);
    this.collection.on('remove', this.onRemove, this);

    this.views = [];
  },

  render() {
    this.collection.map(this.onAdd, this);

    return this;
  },

  onReset() {
    this.$el.empty();
    this.render();
  },

  onAdd(plugin) {
    const View = this.view;
    const view = new View({
      model: plugin,
    });
    this.$el.append(view.$el);
    view.render();

    this.views.push(view);
  },

  onRemove(plugin) {
    const view = this.views.find(entry => entry.model === plugin);
    if (view) {
      view.remove();
      this.views.remove(view);
    }
  },
});
