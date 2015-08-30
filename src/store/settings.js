import _ from 'underscore';
import plugSettings from 'plug/store/settings';
import Settings from '../models/Settings';

const settings = new Settings();

function sync() {
  let newSettings = _.extend({}, plugSettings.settings);
  let muted = $('#volume .icon').hasClass('icon-volume-off');
  // when you mute a song using the volume button, plug.dj does not change the associated setting.
  // here we fake a volume of 0% anyway if the volume is muted, so ExtPlug modules can just
  // use volume throughout and have it work.
  if (newSettings.volume !== 0 && muted) {
    newSettings.volume = 0;
  }
  newSettings.muted = muted;
  settings.set(newSettings);
}

settings.update = sync;

export default settings;
