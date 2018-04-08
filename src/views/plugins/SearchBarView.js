import Backbone from 'backbone';
import { debounce } from 'underscore';
import html from 'nanohtml';

export default Backbone.View.extend({
  initialize({ placeholder }) {
    this.placeholderText = placeholder;
  },

  render() {
    const oninput = debounce(this.onChange.bind(this), 250);

    this.$el.append(html`
      <div class="PluginSearchBar">
        <input class="PluginSearchBar-input" type="text" placeholder="${this.placeholderText}"
               oninput=${oninput} />
        <i class="PluginSearchBar-icon icon icon-search"></i>
      </div>
    `);

    return this;
  },

  onChange(event) {
    this.trigger('search', event.target.value);
  },
});
