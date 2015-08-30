import Plugin from '../Plugin';
import _package from '../package';

// version info
const pad = x => x < 10 ? `0${x}` : x;
const ba = new Date(_package.builtAt);
const builtAt = ba.getUTCFullYear() + '-'
              + pad(ba.getUTCMonth()   + 1) + '-'
              + pad(ba.getUTCDate()    + 1) + ' '
              + pad(ba.getUTCHours()   + 1) + ':'
              + pad(ba.getUTCMinutes() + 1) + ':'
              + pad(ba.getUTCSeconds() + 1) + ' UTC';

const CommandsPlugin = Plugin.extend({
  name: 'Chat Commands',
  description: 'Defines default ExtPlug chat commands.',

  commands: {
    version: 'showVersion',
    reloadsettings: 'reloadRoomSettings',
    disable: 'disableExtPlug'
  },

  showVersion() {
    API.chatLog(`${_package.name} v${_package.version} (${builtAt})`);
  },

  reloadRoomSettings() {
    API.chatLog('Reloading room settings...');
    this.ext.roomSettings
      .once('load', () => API.chatLog('...Done!'))
      .reload();
  },

  disableExtPlug() {
    API.chatLog('Disabling ExtPlug! ' +
                'You cannot re-enable ExtPlug until the next refresh.');
    this.ext.disable();
  }
});

export default CommandsPlugin;
