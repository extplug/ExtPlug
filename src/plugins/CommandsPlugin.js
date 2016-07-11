import Plugin from '../Plugin';
import packageMeta from '../../package.json';

// version info
const pad = x => (x < 10 ? `0${x}` : x);
const ba = new Date(packageMeta.builtAt);
const builtAt = `${ba.getUTCFullYear()}-` +
                `${pad(ba.getUTCMonth() + 1)}-` +
                `${pad(ba.getUTCDate() + 1)} ` +
                `${pad(ba.getUTCHours())}:` +
                `${pad(ba.getUTCMinutes())}:` +
                `${pad(ba.getUTCSeconds())} UTC`;

const CommandsPlugin = Plugin.extend({
  name: 'Chat Commands',
  description: 'Defines default ExtPlug chat commands.',

  commands: {
    version: 'showVersion',
    reloadsettings: 'reloadRoomSettings',
    disable: 'disableExtPlug',
  },

  showVersion() {
    API.chatLog(`${packageMeta.name} v${packageMeta.version} (${builtAt})`);
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
  },
});

export default CommandsPlugin;
