var s = document.createElement('script');
s.src = chrome.extension.getURL('extplug.js');
s.id = 'extplug-extsrc';
s.async = true;
document.body.appendChild(s);
