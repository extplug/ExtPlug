import $ from 'jquery';
import { defer } from 'underscore';
import { after } from 'meld';
import Events from 'plug/core/Events';
import currentUser from 'plug/models/currentUser';
import UserRowView from 'plug/views/rooms/users/RoomUserRowView';
import WaitListRowView from 'plug/views/rooms/users/WaitListRowView';
import userRolloverView from 'plug/views/users/userRolloverView';
import Plugin from '../Plugin';
import getUserClasses from '../util/getUserClasses';

const r = API.ROLE;
const { roleClasses } = getUserClasses;

const UserClasses = Plugin.extend({
  name: 'User Classes',
  description: 'Adds some CSS classes for roles and IDs to various places.',

  enable() {
    this.listenTo(Events, 'chat:beforereceive', this.onChat);

    // common advice for user lists
    const rowAdvice = function afterUpdateRow() {
      // `this` is the row view
      const id = this.model.get('id');
      if (id) {
        this.$el.addClass(getUserClasses(id).join(' '));
      }
    };
    this.rowClasses = after(UserRowView.prototype, 'draw', rowAdvice);
    this.waitListClasses = after(WaitListRowView.prototype, 'render', rowAdvice);
    this.rolloverClasses = after(userRolloverView, 'showSimple', function afterShowSimple() {
      // `this` is the rollover view
      const id = this.user.get('id');
      if (id) {
        this.$el.addClass(getUserClasses(id).join(' '));
      }
    });
    this.onUserChange();
    // guest change, mostly
    this.listenTo(currentUser, 'change:id change:role change:gRole', this.onUserChange);
  },
  disable() {
    this.rowClasses.remove();
    this.waitListClasses.remove();
    this.rolloverClasses.remove();
  },

  onChat(msg) {
    const classes = msg.classes ? [msg.classes] : [];
    if (msg.uid) {
      classes.push(...getUserClasses(msg.uid));
      // additional plugCubed chat-only classes
      // PlugCubed's classes start with `from-` instead of `role-` so we can't
      // just use getUserClasses()
      classes.push(`fromID-${msg.uid}`);

      const user = API.getUser(msg.uid);
      if (msg.uid === API.getUser().id) {
        classes.push('from-you');
      }
      if (user) {
        if (user.gRole === r.HOST) {
          classes.push('from-admin');
        } else if (user.gRole >= r.BOUNCER) {
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
  },

  onUserChange() {
    this.setUserViewClass();
    this.setUserFooterClass();
  },

  setUserViewClass() {
    defer(() => {
      $('#user-view')
        .removeClass()
        .addClass('app-left')
        .addClass(getUserClasses(API.getUser().id).join(' '));
    });
  },

  setUserFooterClass() {
    defer(() => {
      const footer = $('#footer-user');
      const online = footer.hasClass('online');
      const showing = footer.hasClass('showing');
      footer
        .removeClass()
        .toggleClass('online', online)
        .toggleClass('showing', showing)
        .addClass(getUserClasses(API.getUser().id).join(' '));
    });
  },
});

export default UserClasses;
