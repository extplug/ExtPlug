define(function (require, exports, module) {

  const booth = require('plug/models/booth');
  const waitlist = require('plug/collections/waitlist');
  const users = require('plug/collections/users');
  const { difference, extend } = require('underscore');

  const events = {
    WAIT_LIST_LEAVE: 'waitListLeave',
    WAIT_LIST_JOIN: 'waitListJoin'
  };

  function onChange() {
    let newList = booth.get('waitingDJs');
    let oldList = booth.previous('waitingDJs');
    let left = difference(oldList, newList);
    let entered = difference(newList, oldList);

    left.forEach(uid => {
      API.dispatch(API.WAIT_LIST_LEAVE, API.getUser(uid));
    });
    entered.forEach(uid => {
      API.dispatch(API.WAIT_LIST_JOIN, API.getUser(uid));
    });
  }

  exports.install = function () {
    booth.on('change:waitingDJs', onChange);
    extend(API, events);
  };

  exports.uninstall = function () {
    booth.off('change:waitingDJs', onChange);
    Object.keys(events).forEach(n => {
      delete API[n];
    });
  };

});
