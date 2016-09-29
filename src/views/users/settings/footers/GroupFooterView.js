import { extend } from 'underscore';
import $ from 'jquery';
import { View } from 'backbone';

const props = {
  className: 'extplug-group-footer',
};

export default class GroupFooterView extends View {
  render() {
    this.$left = $('<div />').addClass('left');
    this.$right = $('<div />').addClass('right');
    this.$el.append(this.$left, this.$right);

    return super.render();
  }
}

extend(GroupFooterView.prototype, props);
