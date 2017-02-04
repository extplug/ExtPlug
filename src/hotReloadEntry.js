import ExtPlug from './ExtPlug';

if (module.hot && process.env.NODE_ENV !== 'production') {
  console.info('add accept handler');
  module.hot.accept('./ExtPlug', () => {
    console.info('accept ExtPlug');
    if (window.extp) window.extp.disable();
    window.requirejs.undef('extplug');

    console.info('importing');
    import('./ExtPlug').then((ExtPlug) => {
      console.info('imported', ExtPlug);
      window.define('extplug', () => new ExtPlug());

      window.requirejs(['extplug'], (ext) => {
        window.extp = ext;
        ext.enable();
      });
    });
  });
}

export default ExtPlug;
