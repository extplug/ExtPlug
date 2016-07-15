import meld from 'meld';
import Plugin from '../Plugin';

function nop() { return 'Dummy handler to ensure that plug.dj actually triggers the event'; }

// find default plug.dj API event names
const eventKeys = Object.keys(API).filter(key =>
  key.toUpperCase() === key && typeof API[key] === 'string'
);

const EarlyAPIEventsPlugin = Plugin.extend({
  name: 'Early API Events',
  description:
    'Adds "Early" API events. Handlers for these events will always be called ' +
    'before other handlers.',

  enable() {
    this.advice = meld.around(API, 'dispatch', this.intercept);
    eventKeys.forEach(key => {
      // add the API constants for these, too
      API[`BEFORE_${key}`] = `before${API[key].charAt(0).toUpperCase()}${API[key].slice(1)}`;
      // plug.dj checks if an event is actually attached (through the _events hash)
      // before dispatching. We might run into situations where there is a BEFORE_
      // handler, but not a normal one, and we do need to get the BEFORE_ event to
      // trigger there. So we just pretend like we have handlers for all the things.
      API.on(API[key], nop);
    });
  },

  disable() {
    eventKeys.forEach(key => {
      delete API[`BEFORE_${key}`];
      API.off(key, nop);
    });
    this.advice.remove();
  },

  intercept(joinpoint) {
    const [eventName, ...params] = joinpoint.args;

    API.trigger.apply(
      API,
      // userLeave → beforeUserLeave
      [`before${eventName.charAt(0).toUpperCase()}${eventName.slice(1)}`, ...params]
    );

    return joinpoint.proceed();
  },
});

export default EarlyAPIEventsPlugin;
