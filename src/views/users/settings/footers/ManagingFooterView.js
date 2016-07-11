import $ from 'jquery';
import GroupFooterView from './GroupFooterView';

export default class ManagingFooterView extends GroupFooterView {
  render() {
    super.render();
    this.$done = $('<button />').text('Done')
      .on('click', () => this.trigger('unmanage'));
    this.$right.append(this.$done);
    return this;
  }

  remove() {
    this.$done.off();
  }
}
