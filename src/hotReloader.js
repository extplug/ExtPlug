/**
 * Proxy module for hot reloading.
 * Will reload and re-enable ExtPlug when a file changed.
 */
import ExtPlug from './ExtPlug';

if (module.hot) {
  module.hot.accept('./ExtPlug', () => {
    console.log('Accepting ExtPlug');
    if (window.extp) window.extp.disable();
    window.extp = new ExtPlug();
    window.extp.enable();
  });
}

export default ExtPlug;
