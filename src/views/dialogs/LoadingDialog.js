import Dialog from 'plug/views/dialogs/Dialog';
import SpinnerView from 'plug/views/spinner/SpinnerView';

export default Dialog.extend({
  className: 'dialog Dialog',

  render() {
    this.body = this.getBody();

    this.$el.append(
      this.getHeader(this.name),
      this.body.addClass('Dialog-body is-loading'),
    );

    this.spinner = new SpinnerView({
      size: SpinnerView.LARGE,
    });
    this.body.append(this.spinner.$el);
    this.spinner.render();
    this.spinner.$el.css('margin', '50px 0 0 50px');

    return this._super();
  },
});
