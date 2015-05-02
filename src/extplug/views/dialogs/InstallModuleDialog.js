define(function (require, exports, module) {

  const $ = require('jquery');
  const Dialog = require('plug/views/dialogs/Dialog');
  const Events = require('plug/core/Events');
  const AlertEvent = require('plug/events/AlertEvent');
  const SpinnerView = require('plug/views/spinner/SpinnerView');
  const Style = require('extplug/util/Style');

  function dirname(str) {
    str = str.split('/');
    str.pop();
    return str.join('/');
  }
  function basename(str) {
    return str.split('/').pop();
  }

  const InstallModuleDialog = Dialog.extend({
    id: 'dialog-install-module',
    className: 'dialog',
    render() {
      this.$input = $('<input />').attr({
        type: 'text',
        placeholder: 'https://'
      });
      this.$wrap = $('<div />')
        .addClass('dialog-input-background')
        .append(this.$input);
      this.$el
        .append(this.getHeader('Install Module'))
        .append(this.getBody()
          .append(this.getMessage('Enter the URL of the module you wish to install:'))
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
        let url = inp.val().replace(/^http:/, 'https:');
        // By default, requirejs switches to a kind of
        // "normal path" mode when a module name starts with https://
        // or ends in .js. This means that relative paths inside
        // that module definition will also be in that "path" mode,
        // since they will resolve to eg. "https://mysite.com/UserView".
        // Then, because the path starts with https://, requirejs will not
        // append the .js extension.
        // We can get around that by adding a module path alias to
        // https://, turning the module name into something like
        // "extpremote/my-site.com/my-extension" instead, which will
        // make requirejs treat it how we need.
        let modulePath = dirname(url);
        let moduleDir = modulePath.replace(/^https:\/\//, 'extpremote/');
        let moduleName = basename(url).replace(/\.js$/, '');
        extp.install(moduleDir + '/' + moduleName, (err) => {
          this.close();
          if (err) {
            Events.dispatch(new AlertEvent(
              AlertEvent.ALERT,
              'Install Module Error',
              `Error: ${err.message}`,
              () => {}
            ));
          }
          else {
            Events.dispatch(new AlertEvent(
              AlertEvent.ALERT,
              'Install Module',
              'Module installed successfully.',
              () => {}
            ));
          }
        });
      }
    },
    close() {
      this.$input.off();
      this._super();
    }
  });

  InstallModuleDialog._style = new Style({
    '#dialog-install-module': {
      '.dialog-body': { 'height': '137px' },
      '.message': { 'top': '21px' },
      '.spinner': { 'top': '50%', 'left': '50%' },
      '.dialog-input-background': {
        'top': '67px',
        'width': '460px',
        'height': '43px',
        'left': '25px',
        'input': {
          'width': '440px'
        }
      }
    }
  });

  module.exports = InstallModuleDialog;

});