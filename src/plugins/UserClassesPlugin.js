define(function (require, exporst, module) {

  const Plugin = require('../Plugin');
  const getUserClasses = require('../util/getUserClasses');
  const Events = require('plug/core/Events');
  const UserRowView = require('plug/views/rooms/users/RoomUserRowView');
  const WaitListRowView = require('plug/views/rooms/users/WaitListRowView');
  const userRolloverView = require('plug/views/users/userRolloverView');
  const { after } = require('meld');

  const r = API.ROLE;
  const { roleClasses } = getUserClasses;

  const UserClasses = Plugin.extend({
    name: 'User Classes',
    description: 'Adds some CSS classes for roles and IDs to various places.',

    enable() {
      Events.on('chat:beforereceive', this.onChat, this);

      let plugin = this;
      // common advice for user lists
      let rowAdvice = function () {
        // `this` is the row view
        let id = this.model.get('id');
        if (id) {
          this.$el.addClass(getUserClasses(id).join(' '));
        }
      };
      this.rowClasses = after(UserRowView.prototype, 'draw', rowAdvice);
      this.waitListClasses = after(WaitListRowView.prototype, 'render', rowAdvice);
      this.rolloverClasses = after(userRolloverView, 'showSimple', function () {
        // `this` is the rollover view
        let id = this.user.get('id');
        if (id) {
          this.$el.addClass(getUserClasses(id).join(' '));
        }
      });
    },
    disable() {
      Events.off('chat:beforereceive', this.onChat);
      this.rowClasses.remove();
      this.waitListClasses.remove();
      this.rolloverClasses.remove();
    },

    onChat(msg) {
      let classes = msg.classes ? [ msg.classes ] : [];
      if (msg.uid) {
        classes.push(...getUserClasses(msg.uid));
        // additional plugCubed chat-only classes
        // PlugCubed's classes start with `from-` instead of `role-` so we can't
        // just use getUserClasses()
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
