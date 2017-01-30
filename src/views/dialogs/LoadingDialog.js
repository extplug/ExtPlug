import Dialog from 'plug/views/dialogs/Dialog';
import SpinnerView from 'plug/views/spinner/SpinnerView';

import style from './Dialog.css';
import Style from '../../util/Style';

// TODO do this better. Maybe collect all imported CSS into a single chunk that
// can be loaded by a plugin?
new Style().raw(style);

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
