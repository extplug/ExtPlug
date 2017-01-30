import $ from 'jquery';
import Backbone from 'backbone';

export default Backbone.View.extend({
  initialize() {
    this.collection.on('reset', this.onReset, this);
    this.collection.on('add', this.onAdd, this);
    this.collection.on('remove', this.onRemove, this);
    this.collection.on('update reset', this.onUpdate, this);

    this.views = [];
  },

  onResize() {
    this.onUpdate();
  },

  onUpdate() {
    if (this.scrollPane) {
      this.scrollPane.reinitialise();
    }
  },

  render() {
    this.$el.css({
      width: '100%',
      height: '100%',
    });

    this.scrollPane = this.$el.jScrollPane().data('jsp');
    this.collection.map(this.onAdd, this);

    return this;
  },

  remove() {
    this.scrollPane.destroy();
    this.$el.empty();

    return this._super();
  },

  onReset() {
    this.scrollPane.getContentPane().empty();
    this.collection.map(this.onAdd, this);
  },

  onAdd(plugin) {
    const View = this.view;
    const view = new View({
      model: plugin,
    });
    this.scrollPane.getContentPane().append(view.$el);
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
