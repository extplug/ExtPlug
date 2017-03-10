import $ from 'jquery';
import { defer } from 'underscore';
import Dialog from 'plug/views/dialogs/Dialog';
import Events from 'plug/core/Events';
import PluginInstallationEvent from '../../events/PluginInstallationEvent';

const InstallPluginDialog = Dialog.extend({
  id: 'dialog-install-plugin',
  className: 'dialog',

  render() {
    // don't overlay chat
    $('#dialog-container').addClass('is-preview');
    this.$input = $('<input />').attr({
      type: 'text',
      placeholder: 'https://',
    });
    this.$wrap = $('<div />')
      .addClass('dialog-input-background')
      .append(this.$input);
    this.$el
      .append(this.getHeader('Install Plugin'))
      .append(this.getBody()
        .append(this.getMessage('Enter the URL of the plugin you want to install:'))
        .append(this.$wrap))
      .append(this.getButtons('Install', true));
    defer(this.deferFocus.bind(this));
    return this._super();
  },

  deferFocus() {
    this.$input.focus();
  },

  submit() {
    const inp = this.$input;
    const url = inp.val();
    if (url.length > 0 && url.length > 0) {
      Events.dispatch(new PluginInstallationEvent(
        PluginInstallationEvent.INSTALL, { name: '', url }));
    }
  },

  close() {
    $('#dialog-container').removeClass('is-preview');
    this.$input.off();
    this._super();
  },
});

export default InstallPluginDialog;
