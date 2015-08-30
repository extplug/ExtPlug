import $ from 'jquery';

export default request;

var corsproxy = 'https://cors-anywhere.herokuapp.com/';

function request(url, options) {
  var ajax = $.ajax(url, options);
  // try to work around CORS blocks
  if (mayNeedProxy(url)) {
    ajax = ajax.then(null, function () {
      return $.ajax(corsproxy + url);
    });
  }
  return ajax;
}

request.url = function (url) {
  return mayNeedProxy(url) ? corsproxy + url : url;
};

request.json = function (url, options) {
  options = options || {};
  options.dataType = 'json';
  return request(url, options);
};

function mayNeedProxy(url) {
  if (url.substr(0, corsproxy.length) !== corsproxy) {
    let loc = new URL(url);
    if (loc.hostname !== 'plug.dj' && loc.hostname !== 'cdn.plug.dj') {
      return true;
    }
  }
  return false;
}
