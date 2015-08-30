import $ from 'jquery';
import Dialog from 'plug/views/dialogs/Dialog';
import Events from 'plug/core/Events';
import AlertEvent from 'plug/events/AlertEvent';
import SpinnerView from 'plug/views/spinner/SpinnerView';

const InstallPluginDialog = Dialog.extend({
  id: 'dialog-install-plugin',
  className: 'dialog',
  render() {
    // don't overlay chat
    $('#dialog-container').addClass('is-preview');
    this.$input = $('<input />').attr({
      type: 'text',
      placeholder: 'https://'
    });
    this.$wrap = $('<div />')
      .addClass('dialog-input-background')
      .append(this.$input);
    this.$el
      .append(this.getHeader('Install Plugin'))
      .append(this.getBody()
        .append(this.getMessage('Enter the URL of the plugin you wish to install:'))
        .append(this.$wrap))
      .append(this.getButtons('Install', true));
    _.defer(this.deferFocus.bind(this));
    return this._super();
  },
  deferFocus() {
    this.$input.focus();
  },
  submit() {
    let inp = this.$input;
    if (inp.val().length > 0 && inp.val().length > 0) {
      let spinner = new SpinnerView({ size: SpinnerView.LARGE });
      this.$el.find('.dialog-body')
        .empty()
        .append(spinner.$el);
      spinner.render();
      let url = inp.val();
      extp.install(url, (err) => {
        this.close();
        if (err) {
          Events.dispatch(new AlertEvent(
            AlertEvent.ALERT,
            'Install Plugin Error',
            `Error: ${err.message}`,
            () => {}
          ));
        }
        else {
          Events.dispatch(new AlertEvent(
            AlertEvent.ALERT,
            'Install Plugin',
            'Plugin installed successfully.',
            () => {}
          ));
        }
      });
    }
  },
  close() {
    $('#dialog-container').removeClass('is-preview');
    this.$input.off();
    this._super();
  }
});

export default InstallPluginDialog;
