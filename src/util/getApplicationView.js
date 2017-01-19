import { find } from 'underscore';
import Events from 'plug/core/Events';
import ApplicationView from 'plug/views/app/ApplicationView';

/**
 * Gets a reference to the main Plug.DJ ApplicationView instance.
 *
 * The ApplicationView is not stored anywhere public, it just
 * exists as a variable in a require() closure, where we cannot
 * directly retrieve it.
 * However, it adds some events to the global Events channel on render,
 * one of them being "show:room", so that's where we can find a reference.
 *
 * @return {ApplicationView} The ApplicationView instance of this page.
 */
export default function getApplicationView() {
  const evts = Events._events['show:room']; // eslint-disable-line no-underscore-dangle
  // Backbone event handlers have a .ctx property, containing what they will be bound to.
  // And ApplicationView adds a handler that's bound to itself!
  let appView;
  if (evts) {
    appView = find(evts, event => event.ctx instanceof ApplicationView);
  }
  return appView && appView.ctx;
}
