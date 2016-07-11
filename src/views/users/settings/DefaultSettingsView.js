import { each, has } from 'underscore';
import ControlGroupView from './ControlGroupView';
import CheckboxView from './CheckboxView';
import ColorInputView from './ColorInputView';
import DropdownView from './DropdownView';
import InputView from './InputView';
import PlaylistSelectView from './PlaylistSelectView';
import SliderView from './SliderView';

const controlFactory = {
  boolean(setting, value) {
    return new CheckboxView({
      label: setting.label,
      enabled: value,
    });
  },
  dropdown(setting, value) {
    return new DropdownView({
      label: setting.label,
      options: setting.options,
      selected: value,
    });
  },
  slider(setting, value) {
    return new SliderView({
      label: setting.label,
      min: setting.min,
      max: setting.max,
      value,
    });
  },
  text(setting, value) {
    return new InputView({
      label: setting.label,
      description: setting.description,
      value,
    });
  },
  number(setting, value) {
    return new InputView({
      type: 'number',
      label: setting.label,
      description: setting.description,
      value,
      min: has(setting, 'min') ? setting.min : '',
      max: has(setting, 'max') ? setting.max : '',
      step: has(setting, 'step') ? setting.step : '',
    });
  },
  color(setting, value) {
    return new ColorInputView({
      label: setting.label,
      description: setting.description,
      value,
    });
  },
  playlist(setting, value) {
    return new PlaylistSelectView({
      label: setting.label,
      description: setting.description,
      value,
    });
  },
};

const DefaultSettingsView = ControlGroupView.extend({

  render() {
    this.controls = [];

    const meta = this.model.meta();
    const settings = this.model;
    each(meta, (setting, name) => {
      if (has(controlFactory, setting.type)) {
        const control = controlFactory[setting.type](setting, settings.get(name));
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
  },

});

export default DefaultSettingsView;
