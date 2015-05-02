define(function (require, exports, module) {

  const Events = require('plug/core/Events');
  const FooterView = require('./GroupFooterView');
  const ControlGroupView = require('./ControlGroupView');

  const ManagingFooterView = FooterView.extend({
    render() {
      this._super();
      this.$done = $('<button />').text('Done');
      this.$done.on('click', () => {
        Events.trigger('extplug:modules:unmanage');
      });
      this.$right.append(this.$done);
      return this;
    },

    remove() {
      this.$done.off();
    }
  });

  const ManagingListView = ControlGroupView.extend({
    render() {
      this._super();
      this.footer = new ManagingFooterView();
      this.footer.render();
      this.$el.append(this.footer.$el);
      return this;
    }
  });

  module.exports = ManagingListView;

});