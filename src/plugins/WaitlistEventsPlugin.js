import { difference, extend } from 'underscore';
import booth from 'plug/models/booth';
import Plugin from '../Plugin';

const events = {
  WAIT_LIST_LEAVE: 'waitListLeave',
  WAIT_LIST_JOIN: 'waitListJoin',
};

function onChange() {
  const newList = booth.get('waitingDJs');
  const oldList = booth.previous('waitingDJs');
  const left = difference(oldList, newList);
  const entered = difference(newList, oldList);

  left.forEach((uid) => {
    API.dispatch(API.WAIT_LIST_LEAVE, API.getUser(uid));
  });
  entered.forEach((uid) => {
    API.dispatch(API.WAIT_LIST_JOIN, API.getUser(uid));
  });
}

const WaitlistEvents = Plugin.extend({
  name: 'Waitlist Events',
  description: 'Adds events for when users join or leave the waitlist.',

  enable() {
    booth.on('change:waitingDJs', onChange);
    extend(API, events);
  },

  disable() {
    booth.off('change:waitingDJs', onChange);
    Object.keys(events).forEach((n) => {
      delete API[n];
    });
  },
});

export default WaitlistEvents;
