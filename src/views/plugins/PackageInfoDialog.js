import Dialog from 'plug/views/dialogs/Dialog';
import SpinnerView from 'plug/views/spinner/SpinnerView';
import Markdown from './Markdown';
import PluginSearchEngine from '../../PluginSearchEngine';

export default Dialog.extend({
  className: 'dialog PackageInfoDialog',

  initialize() {
    this.searchEngine = new PluginSearchEngine();
  },

  submit() {
    this.trigger('install');
  },

  render() {
    this.body = this.getBody();

    this.$el.append(
      this.getHeader(this.model.get('name')),
      this.body.addClass('PackageInfoDialog-body'),
      this.getButtons('Install', true),
    );

    this.showSpinner();

    this.searchEngine.getPackageInfo(this.model.get('name')).then((pkg) => {
      this.hideSpinner();

      const md = new Markdown({
        linkify: true,
        package: pkg.toJSON(),
      });

      this.body.html(
        md.render(pkg.get('readme')));
    });

    return this._super();
  },

  showSpinner() {
    this.hideSpinner();
    this.body.addClass('is-loading');

    this.spinner = new SpinnerView({
      size: SpinnerView.LARGE,
    });
    this.body.append(this.spinner.$el);
    this.spinner.render();
    this.spinner.$el.css('margin', '50px 0 0 50px');
  },
  hideSpinner() {
    this.body.removeClass('is-loading');
    if (this.spinner) {
      this.spinner.destroy();
      this.spinner = null;
    }
  },
});
