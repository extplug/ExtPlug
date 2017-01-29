import Backbone from 'backbone';
import { debounce } from 'underscore';

export default Backbone.View.extend({
  render() {
    this.$el.append(`
      <div class="SearchBar">
        <input class="SearchBar-input" type="text" placeholder="Search Plugins">
        <i class="SearchBar-icon icon icon-search"></i>
      </div>
    `);

    this.$('.SearchBar-input').on('input', debounce(this.onChange.bind(this), 250));

    return this;
  },

  remove() {
    this.$('.SearchBar-input').off();
  },

  onChange(event) {
    this.trigger('search', event.target.value);
  },
});
