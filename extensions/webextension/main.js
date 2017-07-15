const context = typeof browser !== 'undefined'
  ? browser // Firefox
  : chrome  // Chrome

const s = document.createElement('script');
s.src = context.extension.getURL('extplug.js');
s.id = 'extplug-extsrc';
s.async = true;
document.body.appendChild(s);
