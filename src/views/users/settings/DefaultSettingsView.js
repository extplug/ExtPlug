define(function (require, exports, module) {

  const ControlGroupView = require('./ControlGroupView');
  const CheckboxView = require('./CheckboxView');
  const DropdownView = require('./DropdownView');
  const SliderView = require('./SliderView');
  const { each, has } = require('underscore');

  const controlFactory = {
    boolean(setting, value) {
      return new CheckboxView({
        label: setting.label,
        enabled: value
      });
    },
    dropdown(setting, value) {
      return new DropdownView({
        label: setting.label,
        options: setting.options,
        selected: value
      })
    },
    slider(setting, value) {
      return new SliderView({
        label: setting.label,
        min: setting.min,
        max: setting.max,
        value: settings.get(name)
      })
    }
  };

  const DefaultSettingsView = ControlGroupView.extend({

    render() {
      this.controls = [];

      const meta = this.model.meta();
      const settings = this.model;
      each(meta, (setting, name) => {
        if (has(controlFactory, setting.type)) {
          let control = controlFactory[setting.type](setting, settings.get(name));
          control.on('change', value => settings.set(name, value));
          this.addControl(control);
        }
      });

      this._super();

      return this;
    },

    remove() {
      this.controls.forEach(control => control.destroy());
      this.controls = [];
    }

  });

  module.exports = DefaultSettingsView;

});
