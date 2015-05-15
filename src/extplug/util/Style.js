define(function (require, exports, module) {

  const _ = require('underscore');
  const $ = require('jquery');
  const sistyl = require('sistyl');

  function Style(defaults) {
    this._sistyl = sistyl(defaults);
    this._timeout = null;

    this.refresh = this.refresh.bind(this);

    this.el = $('<style>').attr('type', 'text/css').appendTo('head');
    this.refresh();
  }

  Style.prototype.set = function (sel, props) {
    this._sistyl.set(sel, props);

    // throttle updates
    clearTimeout(this._timeout);
    this._timeout = setTimeout(this.refresh, 1);
    return this;
  };

  Style.prototype.refresh = function () {
    this.el.text(this.toString());
  };

  Style.prototype.remove = function () {
    this.el.remove();
  };

  Style.prototype.toString = function () {
    return this._sistyl.toString();
  };

  return Style;

});
