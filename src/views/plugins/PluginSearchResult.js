import Backbone from 'backbone';
import bel from 'bel';

export default Backbone.View.extend({
  className: 'PluginRow',

  render() {
    const model = this.model.toJSON();

    const homepage = model.links.homepage || model.links.repository || model.links.npm;
    const userLink = model.publisher ? bel`
      <span>
        by
        <a target="_blank" rel="noreferrer noopener" href="https://npmjs.com/~${model.publisher.username}">
          ${model.publisher.username}
        </a>
      </span>
    ` : '';

    this.$el.append(bel`
      <div class="PluginRow-meta">
        <div class="PluginRow-name">
          <span>${model.name}</span>
        </div>
        <div class="PluginRow-description">
          ${model.description}
        </div>
        <div class="PluginRow-published">
          Published ${new Date(model.date).toLocaleDateString()}
          ${userLink}
        </div>
      </div>
    `, bel`
      <div class="PluginRow-buttons">
        <button class="PluginRow-button PluginRow-install">
          <i class="PluginRow-icon icon icon-add"></i>
          <span>Install</span>
        </button>
        <a class="PluginRow-button PluginRow-package" target="_blank" rel="noreferrer noopener" href="${homepage}">
          <i class="PluginRow-icon icon icon-support-white"></i>
          <span>Package</span>
        </a>
      </div>
    `);

    return this;
  },
});
