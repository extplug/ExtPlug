import Plugin from '../Plugin';
import { before } from 'meld';
import plugSettings from 'plug/store/settings';
import extMirror from '../store/settings';

const PlugSettingsPlugin = Plugin.extend({
  name: 'Plug.dj Settings Sync',
  description: 'Mirrors plug.dj settings to the ExtPlug settings model, firing change events.',

  enable() {
    this.advice = before(plugSettings, 'save', this.sync.bind(this));
    this.sync();
  },

  disable() {
    this.advice.remove();
    this.advice = null;
  },

  sync() {
    const newSettings = _.extend({}, plugSettings.settings);
    const muted = $('#volume .icon').hasClass('icon-volume-off');
    // when you mute a song using the volume button, plug.dj does not change the associated setting.
    // here we fake a volume of 0% anyway if the volume is muted, so ExtPlug modules can just
    // use volume throughout and have it work.
    if (newSettings.volume !== 0 && muted) {
      newSettings.volume = 0;
    }
    newSettings.muted = muted;
    extMirror.set(newSettings);
  }
});

export default PlugSettingsPlugin;
