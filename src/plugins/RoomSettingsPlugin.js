import Plugin from '../Plugin';

// TODO move most of the code currently in models/RoomSettings.js into here.
const RoomSettingsPlugin = Plugin.extend({
  name: 'Room Settings',
  description: 'Load room-specific settings.',

  enable() {
    // Reload room settings when a moderator uses RCS's "reload ccs" command.
    this.listenTo(API, 'chat', (message) => {
      if (API.getUser(message.uid).role >= 4 &&
          message.message.startsWith('!rcsreload ccs')) {
        this.ext.roomSettings.reload();
      }
    });
  },

  disable() {
  },
});

export default RoomSettingsPlugin;
