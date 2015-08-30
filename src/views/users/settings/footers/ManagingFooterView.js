import GroupFooterView from './GroupFooterView';

const ManagingFooterView = GroupFooterView.extend({
  render() {
    this._super();
    this.$done = $('<button />').text('Done')
      .on('click', () => this.trigger('unmanage'));
    this.$right.append(this.$done);
    return this;
  },

  remove() {
    this.$done.off();
  }
});

export default ManagingFooterView;
