define(function (require, exporst, module) {

  const Plugin = require('../Plugin');
  const Events = require('plug/core/Events');

  const r = API.ROLE;
  const roleClasses = [
    'user',
    'dj',
    'bouncer',
    'manager',
    'cohost',
    'host'
  ];
  const gRoleClasses = [
    'none',
    '',
    '',
    'ambassador',
    '',
    'admin'
  ];

  const UserClasses = Plugin.extend({
    name: 'User Classes',
    description: 'Adds some CSS classes for roles and IDs to various places.',

    enable() {
      Events.on('chat:beforereceive', this.onChat, this);
    },
    disable() {
      Events.off('chat:beforereceive', this.onChat);
    },

    classesForUser(uid) {
      let classes = [];
      let user = API.getUser(uid);

      // RCS
      classes.push(`id-${uid}`);
      if (user) {
        // role classes
        classes.push(`role-${roleClasses[user.role || 0]}`);
        classes.push(`role-${gRoleClasses[user.gRole || 0]}`);

        // speeeecial classes :sparkles:
        if (user.friend) classes.push('role-friend');
        if (user.sub) classes.push('role-subscriber');
        if (user.id === API.getUser().id) classes.push('role-you');
      }

      return classes;
    },

    onChat(msg) {
      let classes = msg.classes ? [ msg.classes ] : [];
      if (msg.uid) {
        classes.push(...this.classesForUser(msg.uid));
        // additional plugCubed chat-only classes
        // PlugCubed's classes start with `from-` instead of `role-` so we can't
        // just use _classes()
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
          if (user.friend) {
            classes.push('from-friend');
          }
          // normal user & staff roles
          classes.push(`from-${roleClasses[user.role]}`);
        }
      }

      if (msg.sub) {
        classes.push('from-subscriber');
      }

      msg.classes = classes.join(' ');
    }
  });

  module.exports = UserClasses;

});
