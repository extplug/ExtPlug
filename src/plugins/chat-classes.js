define(function (require, exporst, module) {

  const Plugin = require('../Plugin');
  const Events = require('plug/core/Events');

  const ChatClasses = Plugin.extend({
    name: 'Chat Classes',
    description: 'Adds some CSS classes for roles and IDs to chat messages.',

    enable() {
      Events.on('chat:beforereceive', this.onMessage, this);
    },
    disable() {
      Events.off('chat:beforereceive', this.onMessage);
    },

    onMessage(msg) {
      const r = API.ROLE;
      const roleClasses = [
        'from-user',
        'from-dj',
        'from-bouncer',
        'from-manager',
        'from-cohost',
        'from-host'
      ];

      let classes = msg.classes ? [ msg.classes ] : [];
      if (msg.uid) {
        classes.push(`fromID-${msg.uid}`);

        let user = API.getUser(msg.uid);
        if (msg.uid === API.getUser().id) {
          classes.push('from-you');
        }
        if (user) {
          if (user.gRole === r.HOST) {
            classes.push('from-admin');
          }
          else if (user.gRole >= r.BOUNCER) {
            classes.push('from-ambassador');
          }
          // normal user & staff roles
          classes.push(roleClasses[user.role]);
        }
      }

      if (msg.sub) {
        classes.push('from-subscriber');
      }

      msg.classes = classes.join(' ');
    }
  });

  module.exports = ChatClasses;

});
