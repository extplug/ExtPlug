import $ from 'jquery';

const corsproxy = 'https://cors-anywhere.herokuapp.com/';

function mayNeedProxy(url) {
  if (url.substr(0, corsproxy.length) !== corsproxy) {
    const loc = new URL(url);
    if (loc.hostname !== 'plug.dj' && loc.hostname !== 'cdn.plug.dj') {
      return true;
    }
  }
  return false;
}

export default function request(url, options) {
  let ajax = $.ajax(url, options);
  // try to work around CORS blocks
  if (mayNeedProxy(url)) {
    ajax = ajax.then(null, () => $.ajax(corsproxy + url));
  }
  return ajax;
}

function proxyUrl(url) {
  return mayNeedProxy(url) ? corsproxy + url : url;
}
export { proxyUrl as url };

export function json(url, options) {
  return request(url, {
    ...options,
    dataType: 'json',
  });
}

request.url = proxyUrl;
request.json = json;
