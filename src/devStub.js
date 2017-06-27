/* eslint-disable */
requirejs.config({
  paths: { 'extplug/__internalExtPlug__': ADDRESS.replace(/\.js$/, '') }
});

function getEvents() {
  return require('plug/core/Events');
}

// Self-signed HTTPS certificate check.
function tryAccess() {
  return window.jQuery.get(PUBLIC_PATH);
}

function checkCertificate() {
  tryAccess().fail(function () {
    getEvents().trigger('notify', 'icon-chat-system',
      'Error: Could not load the ExtPlug dev mode extension. This is probably because its certificate is not whitelisted. ' +
      'Please click here and whitelist the certificate.', function () {
        window.open(PUBLIC_PATH + 'ok.html');
        var i = setInterval(function () {
          tryAccess().then(function () {
            clearInterval(i);
            window.location.reload();
          }).fail(function () {
            console.log('waiting for approval...');
          });
        }, 1500);
      });
  });
}

var i = setInterval(function () {
  try {
    getEvents();
    clearInterval(i);
    checkCertificate();
  } catch (e) {}
}, 200);
