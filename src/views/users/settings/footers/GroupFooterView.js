import $ from 'jquery';
import { View } from 'backbone';

export default class GroupFooterView extends View {
  className = 'extplug-group-footer';

  render() {
    this.$left = $('<div />').addClass('left');
    this.$right = $('<div />').addClass('right');
    this.$el.append(this.$left, this.$right);

    return super.render();
  }
}
