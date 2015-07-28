define(function (require, exporst, module) {

  const Plugin = require('../Plugin');
  const Events = require('plug/core/Events');
  const UserRowView = require('plug/views/rooms/users/RoomUserRowView');
  const userRolloverView = require('plug/views/users/userRolloverView');
  const { after } = require('meld');

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
      let plugin = this;
      Events.on('chat:beforereceive', this.onChat, this);
      this.rowClasses = after(UserRowView.prototype, 'draw', function () {
        // `this` is the row view
        let id = this.model.get('id');
        if (id) {
          this.$el.addClass(plugin.classesForUser(id).join(' '));
        }
      });
      this.rolloverClasses = after(userRolloverView, 'showSimple', function () {
        // `this` is the rollover view
        let id = this.user.get('id');
        if (id) {
          this.$el.addClass(plugin.classesForUser(id).join(' '));
        }
      });
    },
    disable() {
      Events.off('chat:beforereceive', this.onChat);
      this.rowClasses.remove();
      this.rolloverClasses.remove();
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
