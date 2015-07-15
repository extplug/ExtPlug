define(function (require, exports, module) {

  const CheckboxView = require('./CheckboxView');
  const RemoveBoxView = require('./RemoveBoxView');
  const PluginsFooterView = require('./footers/PluginsFooterView');
  const ManagingFooterView = require('./footers/ManagingFooterView');
  const ControlGroupView = require('./ControlGroupView');

  const PluginsGroupView = ControlGroupView.extend({

    initialize() {
      this.collection.on('reset add remove', this.onUpdate, this);
      this.onUpdate();
    },

    render() {
      this._super();
      this.footer = new PluginsFooterView();
      this.footer.render();
      this.$el.append(this.footer.$el);

      this.footer.on('manage', this.manage, this);
      this.footer.on('unmanage', this.unmanage, this);

      return this;
    },

    onUpdate() {
      const Control = this.managing ? RemoveBoxView : CheckboxView;
      this.controls = this.collection.toArray().map(plugin => {
        let box = new Control({
          label: plugin.get('name'),
          description: plugin.get('instance').description || false,
          enabled: plugin.get('enabled')
        });
        box.on('change', enabled => {
          if (enabled) {
            plugin.get('instance').enable();
          }
          else {
            plugin.get('instance').disable();
          }
        });
        return box;
      });
    },

    manage() {
      this.managing = true;
      this.onUpdate();
    },
    unmanage() {
      this.managing = false;
      this.onUpdate();
    }

  });

  module.exports = PluginsGroupView;

});
