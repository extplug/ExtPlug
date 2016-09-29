import CheckboxView from './CheckboxView';
import RemoveBoxView from './RemoveBoxView';
import PluginsFooterView from './footers/PluginsFooterView';
import ManagingFooterView from './footers/ManagingFooterView';
import ControlGroupView from './ControlGroupView';

export default class PluginsGroupView extends ControlGroupView {
  constructor(options) {
    super(options);

    this.collection.on('reset add remove', this.onUpdate, this);
    this.onUpdate();
  }

  render() {
    this.$el.empty();

    super.render();
    this.renderFooter();

    return this;
  }

  renderFooter() {
    if (this.footer) {
      this.footer.destroy();
    }
    this.footer = this.managing ? new ManagingFooterView() : new PluginsFooterView();
    this.footer.on('unmanage', this.unmanage, this);
    this.footer.on('manage', this.manage, this);
    this.footer.render();
    this.$el.append(this.footer.$el);
  }

  onUpdate() {
    this.controls = this.collection.toArray().map((plugin) => {
      let box = null;
      if (this.managing) {
        box = new RemoveBoxView({ model: plugin });
      } else {
        box = new CheckboxView({
          label: plugin.get('name'),
          description: plugin.get('instance').description || false,
          enabled: plugin.get('enabled'),
        });
      }
      box.on('change', (enabled) => {
        if (enabled) {
          plugin.get('instance').enable();
        } else {
          plugin.get('instance').disable();
        }
      });
      return box;
    });
  }

  manage() {
    this.managing = true;
    this.onUpdate();
    this.render();
  }
  unmanage() {
    this.managing = false;
    this.onUpdate();
    this.render();
  }
}
