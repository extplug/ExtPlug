define(function (require, exports, module) {

  const API = window.API;

  // CSS classes for room-specific roles
  const roleClasses = [
    'user',
    'dj',
    'bouncer',
    'manager',
    'cohost',
    'host'
  ];
  // CSS classes for global roles
  const gRoleClasses = [
    'none',
    '',
    '',
    'ambassador',
    '',
    'admin'
  ];

  /**
   * Gets RCS-style user CSS classes for the given user ID. Added classes are:
   *
   *   * "id-${USER_ID}" for the user ID;
   *   * "role-host/cohost/manager/bouncer/user" for room-specific roles;
   *   * "role-admin/ambassador/none" for global roles;
   *   * "role-friend" for friends;
   *   * "role-subscriber" for subscribers;
   *   * "role-you" for the current user.
   *
   * All these classes are additive, so if you have a friend who is a manager
   * in the current room, they will receive all of the following classes:
   *
   *     "id-${THEIR_ID} role-manager role-none role-friend"
   */
  function getUserClasses(uid) {
    let classes = [];
    let user = API.getUser(uid);

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
  }

  module.exports = getUserClasses;
  getUserClasses.roleClasses = roleClasses;
  getUserClasses.gRoleClasses = gRoleClasses;

});
